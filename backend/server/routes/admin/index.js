import { Hono } from "hono";
import { Resend } from 'resend';

/**
 * setupAdminRoutes — registers modularized admin management routes.
 * Hero slides handlers are inlined here because admin.controller.js
 * has encoding issues from the original generation phase.
 * Other admin endpoints remain inline in worker.js (getAdminStats, etc.)
 */
export const setupAdminRoutes = (app, authMiddleware, adminMiddleware) => {

  // ─── Hero Slides ─────────────────────────────────────────────────────────────
  // Public GET (no auth) so the landing page carousel can load without a token
  app.get('/hero-slides', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const includeAll = c.req.query('all') === 'true';
    try {
      const slides = await prisma.homepageHero.findMany({
        where: includeAll ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return c.json(slides);
    } catch (err) {
      // Table may not exist yet — return empty array so frontend degrades gracefully
      if (
        err.code === 'P2021' ||
        err.message?.includes('does not exist') ||
        err.message?.includes('homepage_heroes')
      ) {
        console.warn('[HeroSlides] Table not found — returning empty array');
        return c.json([]);
      }
      console.error('[HeroSlides] GET error:', err.message);
      return c.json({ error: 'Failed to fetch hero slides' }, 500);
    }
  });

  app.post('/hero-slides', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const data = await c.req.json();
      const slide = await prisma.homepageHero.create({ data });
      return c.json(slide, 201);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.put('/hero-slides/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const data = await c.req.json();
      const slide = await prisma.homepageHero.update({ where: { id }, data });
      return c.json(slide);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.delete('/hero-slides/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      await prisma.homepageHero.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/hero-slides/reorder', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const { ids } = await c.req.json();
      if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400);
      await Promise.all(
        ids.map((id, index) =>
          prisma.homepageHero.update({ where: { id }, data: { sortOrder: index } })
        )
      );
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

app.get('/admin/stats', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const [userCount, resortCount, bookingCount, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        where: { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] } },
        select: { totalPrice: true, commissionRate: true }
      })
    ]);

    const totalRevenue = revenueData.reduce((sum, b) => sum + b.totalPrice, 0);
    const platformEarnings = revenueData.reduce((sum, b) => sum + (b.totalPrice * (b.commissionRate / 100)), 0);

    return c.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue,
      platformEarnings: platformEarnings,
      platformRating: 4.9,
      avgBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          guideServiceEnabled: true,
          defaultCommissionRate: 7.0,
          requireOtpForSignup: true,
          maintenanceMode: false,
          detailedAuditLogging: true,
          notifyNewUsers: true,
          notifyHighValueBookings: true,
          notifySystemAlerts: true,
        }
      });
    }
    return c.json(settings);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.on(['POST', 'PATCH'], '/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payload = await c.req.json();
  const userPayload = c.get('user');
  try {
    let adminEmail = userPayload?.email;
    if (!adminEmail && userPayload?.userId) {
      const adminUser = await prisma.user.findUnique({ where: { id: userPayload.userId } });
      if (adminUser) adminEmail = adminUser.email;
    }
    adminEmail = adminEmail || userPayload?.userId || 'system';

    let settings = await prisma.systemSettings.findFirst();
    const data = {};
    
    const allowedKeys = [
      'guideServiceEnabled', 'defaultCommissionRate', 'requireOtpForSignup',
      'maintenanceMode', 'detailedAuditLogging', 'notifyNewUsers',
      'notifyHighValueBookings', 'notifySystemAlerts'
    ];
    
    for (const key of allowedKeys) {
      if (payload[key] !== undefined) {
        data[key] = payload[key];
      }
    }
    
    if (Object.keys(data).length > 0) {
      data.updatedBy = adminEmail;
    }

    const previousSettings = settings ? { ...settings } : null;

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          ...data,
          guideServiceEnabled: data.guideServiceEnabled ?? true,
          defaultCommissionRate: data.defaultCommissionRate ?? 7.0,
          requireOtpForSignup: data.requireOtpForSignup ?? true,
          updatedBy: adminEmail
        }
      });
    }

    console.log(`[AUDIT] System Settings updated by Admin: ${adminEmail}. ` + 
      `Changes: ${JSON.stringify(data)}. ` + 
      `Previous: ${JSON.stringify(previousSettings)}`);

    if (settings && settings.detailedAuditLogging) {
      const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
      const userAgent = c.req.header('user-agent') || null;
      try {
        await prisma.auditLog.create({
          data: {
            adminId: userPayload?.userId || 'system',
            action: 'SETTINGS_UPDATED',
            details: JSON.parse(JSON.stringify(data)),
            ipAddress,
            userAgent
          }
        });
      } catch (err) {
        console.error('Failed to insert audit log:', err);
      }
    }

    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/verification-settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    let settings = await prisma.verificationSettings.findFirst();
    if (!settings) {
      settings = await prisma.verificationSettings.create({
        data: {
          travellerRequirements: ['MOBILE_OTP', 'EMAIL_VERIFICATION'],
          resortOwnerRequirements: ['AADHAAR', 'PAN'],
          guideRequirements: ['AADHAAR']
        }
      });
    }
    return c.json(settings);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/admin/verification-settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payload = await c.req.json();
  const userPayload = c.get('user');
  
  try {
    let adminEmail = userPayload?.email;
    if (!adminEmail && userPayload?.userId) {
      const adminUser = await prisma.user.findUnique({ where: { id: userPayload.userId } });
      if (adminUser) adminEmail = adminUser.email;
    }
    adminEmail = adminEmail || userPayload?.userId || 'system';

    let settings = await prisma.verificationSettings.findFirst();
    const data = {};
    
    if (payload.travellerRequirements !== undefined) data.travellerRequirements = payload.travellerRequirements;
    if (payload.resortOwnerRequirements !== undefined) data.resortOwnerRequirements = payload.resortOwnerRequirements;
    if (payload.guideRequirements !== undefined) data.guideRequirements = payload.guideRequirements;
    
    if (Object.keys(data).length > 0) {
      data.updatedBy = adminEmail;
    }

    const previousSettings = settings ? { ...settings } : null;

    if (settings) {
      settings = await prisma.verificationSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.verificationSettings.create({
        data: {
          ...data,
          updatedBy: adminEmail
        }
      });
    }

    // Audit Logging
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
    const userAgent = c.req.header('user-agent') || null;
    try {
      await prisma.auditLog.create({
        data: {
          adminId: userPayload?.userId || 'system',
          action: 'VERIFICATION_SETTINGS_UPDATED',
          details: JSON.parse(JSON.stringify({ previous: previousSettings, new: data })),
          ipAddress,
          userAgent
        }
      });
    } catch (err) {
      console.error('Failed to insert audit log:', err);
    }

    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// User Management
app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const role = c.req.query('role');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const skip = (page - 1) * limit;

  try {
    const whereClause = {
      ...(role && role !== 'ALL' ? { role } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      } : {})
    };

    const [users, totalCount, verifiedCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          phone: true,
          kycStatus: true,
          avatar: true,
          verifiedEmail: true,
          verifiedPhone: true,
          isEmailVerified: true,
          isMobileVerified: true,
          deletedAt: true,
          ownerProfile: role === 'RESORT_OWNER' ? { select: { businessName: true, isVerified: true, _count: { select: { resorts: true } } } } : false,
          guideProfile: role === 'GUIDE' ? { select: { specialties: true, languages: true, isActive: true, rating: true, isVerified: true, status: true } } : false,
          _count: {
            select: {
              bookings: true,
              wishlist: true,
              guideBookings: true
            }
          }
        }
      }),
      prisma.user.count({ where: whereClause }),
      prisma.user.count({ where: { ...whereClause, OR: [{ verifiedEmail: true }, { isEmailVerified: true }] } })
    ]);

    return c.json({
      users,
      totalCount,
      verifiedCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  try {
    await prisma.user.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Resort Management
app.get('/admin/resorts/pending', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        type: true,
        locationArea: true,
        locationLat: true,
        locationLng: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        isFeatured: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        categories: true,
        houseRules: true,
        mealPackages: true,
        status: true,
        commissionRate: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    return c.json(mappedResorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/resorts/active', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const skip = (page - 1) * limit;

  try {
    const [totalCount, resorts] = await Promise.all([
      prisma.resort.count({ where: { status: 'APPROVED' } }),
      prisma.resort.findMany({
        where: { status: 'APPROVED' },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          description: true,
          type: true,
          locationArea: true,
          locationLat: true,
          locationLng: true,
          images: true,
          amenities: true,
          rating: true,
          reviewCount: true,
          pricePerNight: true,
          isFeatured: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          categories: true,
          houseRules: true,
          mealPackages: true,
          status: true,
          commissionRate: true,
          owner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  phone: true,
                  createdAt: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    return c.json({
      data: mappedResorts,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { status } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/commission', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { commissionRate } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { commissionRate } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/feature', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { isFeatured } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { isFeatured } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Booking Management
app.get('/admin/bookings/all', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        status: true,
        specialRequests: true,
        referenceNumber: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        resortId: true,
        roomId: true,
        commissionRate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        resort: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Guide Management
app.get('/admin/guides', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const guides = await prisma.guideProfile.findMany({
      include: { 
        user: true,
        payouts: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Decrypt guide profiles and nested users, secure idImage
    const decryptedGuides = guides.map(g => {
      const decGuide = decryptGuide(g);
      if (decGuide.user) {
        decGuide.user = decryptUser(decGuide.user);
      }
      if (decGuide.idImage) {
        decGuide.idImage = generateSignedKycUrlWorker(decGuide.id, c.env);
      }
      return decGuide;
    });

    return c.json(decryptedGuides);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { status, rejectionReason } = await c.req.json();
  try {
    // Fetch existing guide profile for audit log baseline
    const existingGuide = await prisma.guideProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingGuide) {
      return c.json({ error: 'Guide profile not found' }, 404);
    }

    const previousStatus = existingGuide.status;

    // Run KYC Fraud check dynamically
    let fraudScore = 0;
    let fraudFlags = [];
    if (existingGuide.userId && existingGuide.idNumber) {
      const fraudCheck = await runKycFraudCheckWorker(existingGuide.userId, existingGuide.idNumber, existingGuide.idImage, prisma);
      fraudScore = fraudCheck.score;
      fraudFlags = fraudCheck.flags;
    }

    const updateData = { 
      status,
      fraudScore,
      fraudFlags
    };
    
    if (status === 'APPROVED') {
      updateData.rejectionReason = null;
      updateData.isVerified = true;
      updateData.isActive = true;
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason || 'Identity document was unreadable or invalid.';
      updateData.isVerified = false;
      updateData.isActive = false;
    } else if (status === 'UNDER_REVIEW') {
      updateData.isVerified = false;
    }

    const guide = await prisma.guideProfile.update({ 
      where: { id }, 
      data: updateData,
      include: { user: true }
    });

    if (guide.userId) {
      const userUpdateData = {
        kycStatus: status,
        kycRejectionReason: status === 'REJECTED' ? (rejectionReason || 'Identity document was unreadable or invalid.') : null,
        fraudScore,
        fraudFlags
      };

      await prisma.user.update({
        where: { id: guide.userId },
        data: userUpdateData
      });

      // Log Verification Audit Trail
      const adminId = c.req.user?.userId || 'worker-admin';
      const adminName = c.req.user?.email || 'Admin';
      const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
      const userAgent = c.req.header('user-agent') || null;

      await prisma.verificationAudit.create({
        data: {
          adminId,
          adminName,
          targetUserId: guide.userId,
          targetName: guide.user.name || 'Local Guide',
          targetType: 'GUIDE',
          action: status,
          rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Identity document was unreadable or invalid.') : null,
          previousStatus,
          newStatus: status,
          ipAddress,
          userAgent
        }
      });

      // Platform Audit Log Entry
      try {
        await prisma.auditLog.create({
          data: {
            adminId: c.req.user?.userId || 'system',
            action: `GUIDE_STATUS_${status}`,
            details: {
              targetGuideId: guide.id,
              targetUserId: guide.userId,
              previousStatus,
              newStatus: status,
              rejectionReason
            },
            ipAddress,
            userAgent
          }
        });
      } catch (auditErr) {
        console.error('Failed to create audit log for guide status:', auditErr);
      }

      // Create internal notification
      const notificationTitle = status === 'APPROVED' ? 'Identity Verification Approved' : 'Identity Verification Rejected';
      const notificationMessage = status === 'APPROVED'
        ? 'Congratulations! Your identity documents have been verified. Your profile is now live.'
        : `Your identity verification failed. Reason: ${rejectionReason || 'Identity document was unreadable or invalid.'}`;

      await prisma.notification.create({
        data: {
          userId: guide.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED'
        }
      });

      // Send email notification via Resend
      if (c.env.RESEND_API_KEY && guide.user.email) {
        const resend = new Resend(c.env.RESEND_API_KEY);
        const emailFrom = c.env.EMAIL_FROM || 'onboarding@resend.dev';
        const userName = guide.user.name;
        const toEmail = guide.user.email;

        let emailHtml = '';
        let emailSubject = '';

        if (status === 'APPROVED') {
          emailSubject = 'Identity Verification Approved | HampiStays';
          emailHtml = `
            <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF9F6; color: #0C1E36; border: 1px solid #E6D5B8; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #C5A880; font-size: 28px; margin: 0; letter-spacing: 0.1em; text-transform: uppercase;">HampiStays</h2>
                <p style="font-size: 12px; text-transform: uppercase; tracking: 0.2em; color: rgba(12, 30, 54, 0.4); margin-top: 5px;">Exclusive Heritage Stays & Experiences</p>
              </div>
              <div style="background-color: #FFFFFF; padding: 40px; border-radius: 12px; border: 1px solid #F0ECE3; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <h3 style="font-size: 22px; margin-top: 0; color: #0C1E36;">Identity Verification Approved</h3>
                <p>Dear ${userName},</p>
                <p>We are pleased to inform you that your identity documents have been successfully verified by our administrative team.</p>
                <p>Your local guide profile is now fully verified and visible to travellers searching for expert guides in Hampi.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="https://hampistays.com/dashboard" style="background-color: #0C1E36; color: #FAF9F6; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Access Your Dashboard</a>
                </div>
                <p style="font-size: 14px; color: rgba(12, 30, 54, 0.6); line-height: 1.6;">Warm regards,<br>The HampiStays Team</p>
              </div>
            </div>
          `;
        } else if (status === 'REJECTED') {
          emailSubject = 'Identity Verification Update | HampiStays';
          emailHtml = `
            <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF9F6; color: #0C1E36; border: 1px solid #E6D5B8; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #C5A880; font-size: 28px; margin: 0; letter-spacing: 0.1em; text-transform: uppercase;">HampiStays</h2>
                <p style="font-size: 12px; text-transform: uppercase; tracking: 0.2em; color: rgba(12, 30, 54, 0.4); margin-top: 5px;">Exclusive Heritage Stays & Experiences</p>
              </div>
              <div style="background-color: #FFFFFF; padding: 40px; border-radius: 12px; border: 1px solid #F0ECE3; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <h3 style="font-size: 22px; margin-top: 0; color: #D32F2F;">Identity Verification Update</h3>
                <p>Dear ${userName},</p>
                <p>Thank you for submitting your identity documents for guide verification on HampiStays.</p>
                <p>Unfortunately, our administrative team was unable to verify your profile at this time due to the following reason:</p>
                <div style="background-color: #FFF8F8; border-left: 4px solid #D32F2F; padding: 15px 20px; margin: 20px 0; font-family: sans-serif; font-size: 14px; color: #555555; border-radius: 0 8px 8px 0;">
                  <strong>Reason for Rejection:</strong><br>
                  ${rejectionReason || 'Identity document was unreadable or invalid.'}
                </div>
                <p>Please log in to your dashboard to re-upload clear and valid identity documents (such as Aadhaar, PAN, or Passport) to complete your verification.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="https://hampistays.com/dashboard" style="background-color: #0C1E36; color: #FAF9F6; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Update Documents</a>
                </div>
                <p style="font-size: 14px; color: rgba(12, 30, 54, 0.6); line-height: 1.6;">Warm regards,<br>The HampiStays Team</p>
              </div>
            </div>
          `;
        }

        c.executionCtx.waitUntil(
          resend.emails.send({
            from: emailFrom,
            to: toEmail,
            subject: emailSubject,
            html: emailHtml
          }).catch(err => console.error("Async KYC email send failed:", err))
        );
      }
    }

    const decryptedGuide = decryptGuide(guide);
    if (decryptedGuide.user) {
      decryptedGuide.user = decryptUser(decryptedGuide.user);
    }
    return c.json(decryptedGuide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/kyc-image/:id', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const expires = c.req.query('expires');
  const token = c.req.query('token');

  if (!verifySignedKycUrlWorker(id, expires, token, c.env)) {
    return c.json({ error: 'Forbidden: Invalid or expired signature' }, 403);
  }

  let idImage = null;
  const guide = await prisma.guideProfile.findUnique({ where: { id } });
  if (guide && guide.idImage) {
    idImage = decrypt(guide.idImage);
  } else {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.idImage) {
      idImage = decrypt(user.idImage);
    }
  }

  if (!idImage) {
    return c.json({ error: 'KYC Document not found' }, 404);
  }

  const transform = c.req.query('transform');
  let redirectUrl = idImage;
  if (transform && redirectUrl.includes('cloudinary.com')) {
    redirectUrl = redirectUrl.replace('/upload/', `/upload/${transform}/`);
  }

  return c.redirect(redirectUrl);
});

app.get('/admin/audit-logs', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const skip = (page - 1) * limit;

  try {
    const [totalCount, logs] = await Promise.all([
      prisma.verificationAudit.count(),
      prisma.verificationAudit.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    return c.json({
      data: logs,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/:id/toggle-active', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { isActive } = await c.req.json();
  try {
    const guide = await prisma.guideProfile.update({ where: { id }, data: { isActive } });
    
    // Platform Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          adminId: c.req.user?.userId || 'system',
          action: isActive ? 'GUIDE_ACTIVATED' : 'GUIDE_SUSPENDED',
          details: { targetGuideId: id },
          ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
          userAgent: c.req.header('user-agent') || null
        }
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for guide toggle:', auditErr);
    }
    
    return c.json(guide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/toggle-all', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const { isActive } = await c.req.json();
  try {
    await prisma.guideProfile.updateMany({ data: { isActive } });
    
    // Platform Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          adminId: c.req.user?.userId || 'system',
          action: isActive ? 'GUIDES_GLOBAL_ACTIVATED' : 'GUIDES_GLOBAL_SHUTDOWN',
          details: { },
          ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
          userAgent: c.req.header('user-agent') || null
        }
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for global guide toggle:', auditErr);
    }
    
    return c.json({ success: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/bank/:payoutId/verify', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payoutId = c.req.param('payoutId');
  try {
    const bank = await prisma.guidePayout.update({
      where: { id: payoutId },
      data: { status: 'BANK_VERIFIED' }
    });
    
    // Log Audit
    try {
      const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
      const userAgent = c.req.header('user-agent') || null;
      await prisma.auditLog.create({
        data: {
          adminId: c.req.user?.userId || 'system',
          action: 'GUIDE_BANK_VERIFIED',
          details: { payoutId },
          ipAddress,
          userAgent
        }
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for bank verify:', auditErr);
    }
    
    return c.json(bank);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Stubs for remaining dashboard tabs
app.get('/admin/payouts', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const payouts = await prisma.guidePayout.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        guideProfile: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });
    return c.json(payouts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/payouts/:payoutId/status', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payoutId = c.req.param('payoutId');
  const { status } = await c.req.json();
  try {
    const payout = await prisma.guidePayout.update({
      where: { id: payoutId },
      data: { status }
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: c.req.user?.userId || 'system',
          action: `PAYOUT_STATUS_${status}`,
          details: { payoutId },
          ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
          userAgent: c.req.header('user-agent') || null
        }
      });
    } catch (auditErr) { console.error('Failed to create audit log for payout status:', auditErr); }

    return c.json(payout);
  } catch (err) { return c.json({ error: err.message }, 500); }
});
app.get('/admin/security/stats', authMiddleware, adminMiddleware, (c) => c.json({ logs: [], activeSessions: 1 }));
app.get('/admin/reviews/flagged', authMiddleware, adminMiddleware, (c) => c.json([]));
app.get('/admin/otp-logs', authMiddleware, adminMiddleware, (c) => c.json([]));

// Bookings & Payments
app.post('/bookings', authMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const data = await c.req.json();
  const { resortId, roomId, checkIn, checkOut, guests, specialRequests, addInsurance, airportPickup, selectedMeals, couponCode } = data;
  const payload = c.get('user');
  
  try {
    // We run the concurrency check and booking creation in a transaction
    const { booking, totalPrice, referenceNumber } = await prisma.$transaction(async (tx) => {
      // 1. RECALCULATE PRICE & FETCH ROOM DETAILS
      const resort = await tx.resort.findUnique({ 
        where: { id: resortId },
        include: { roomTypes: true }
      });
      
      if (!resort) throw new Error('Resort not found');
      
      const room = resort.roomTypes.find(r => r.id === roomId);
      if (!room) throw new Error('Room type not found');

      // Parse dates safely
      const parseDate = (d) => {
        const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
        const [y, m, day] = s.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, day));
      };
      const startDate = parseDate(checkIn);
      const endDate = parseDate(checkOut);
      
      // 2. CONCURRENCY CHECK: OVERLAP VALIDATION
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const overlappingBookings = await tx.booking.count({
        where: {
          roomId: roomId,
          checkIn: { lt: endDate },
          checkOut: { gt: startDate },
          OR: [
            { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN'] } },
            { status: 'PENDING', createdAt: { gt: fifteenMinsAgo } }
          ]
        }
      });

      // If all available units for this room type are taken, abort!
      if (overlappingBookings >= room.availableCount) {
        throw new Error('ROOM_UNAVAILABLE');
      }

      // 3. PRICE CALCULATION
      const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const nightsTotal = room.pricePerNight * nights;
      const taxes = Math.round(nightsTotal * 0.12);
      const insuranceCost = addInsurance ? Math.round(nightsTotal * 0.02) : 0;
      const airportPickupCost = airportPickup ? 1500 : 0;

      // Meal Packages calculation (with 5% GST for F&B)
      let mealTotal = 0;
      const validatedMealDescriptions = [];
      const resortMealPackages = resort.mealPackages || [];
      if (Array.isArray(selectedMeals) && selectedMeals.length > 0) {
        for (const mealName of selectedMeals) {
          const pkg = resortMealPackages.find(p => p.name === mealName);
          if (pkg) {
            const guestCount = Number(guests) || 1;
            const cost = pkg.price * guestCount * nights;
            mealTotal += cost;
            validatedMealDescriptions.push(`${pkg.name} (Γé╣${pkg.price} x ${guestCount} guests x ${nights} nights = Γé╣${cost})`);
          }
        }
      }
      const mealTaxes = Math.round(mealTotal * 0.05);
      
      const computedTotal = nightsTotal + taxes + insuranceCost + airportPickupCost + mealTotal + mealTaxes;

      // Secure Coupon Discount Calculation on Backend
      let discountAmount = 0;
      let finalAmount = computedTotal;
      if (couponCode) {
        const couponResult = await validateCouponCode(tx, {
          code: couponCode,
          userId: payload.userId,
          resortId,
          originalAmount: computedTotal
        });

        if (!couponResult.valid) {
          throw new Error(`COUPON_INVALID:${couponResult.error}`);
        }

        discountAmount = couponResult.discountAmount;
        finalAmount = couponResult.finalAmount;
      }

      const refNum = `HST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Format special requests to store selected meals in DB
      let formattedSpecialRequests = specialRequests || "";
      if (validatedMealDescriptions.length > 0) {
        const prefix = `[Selected Meals: ${validatedMealDescriptions.join("; ")}]`;
        formattedSpecialRequests = formattedSpecialRequests ? `${prefix} ${formattedSpecialRequests}` : prefix;
      }

      // 4. CREATE PENDING RESERVATION (LOCK)
      // Note: coupon fields (originalAmount, discountAmount, couponCode) are NOT in the
      // Prisma Booking model. They are tracked via the couponDb fallback layer.
      // totalPrice stores the final (post-discount) amount that matches the Razorpay order.
      let finalSpecialRequests = formattedSpecialRequests;
      if (couponCode && discountAmount > 0) {
        const couponNote = `[Coupon: ${couponCode.trim().toUpperCase()}, Discount: Γé╣${discountAmount}, Original: Γé╣${computedTotal}]`;
        finalSpecialRequests = finalSpecialRequests ? `${couponNote} ${finalSpecialRequests}` : couponNote;
      }

      const newBooking = await tx.booking.create({
        data: {
          userId: payload.userId,
          resortId,
          roomId,
          checkIn: startDate,
          checkOut: endDate,
          guests: parseInt(guests) || 1,
          totalPrice: finalAmount,
          specialRequests: finalSpecialRequests,
          referenceNumber: refNum,
          commissionRate: resort.commissionRate || 7.0,
          status: 'PENDING'
        }
      });

      return {
        booking: newBooking,
        totalPrice: finalAmount,
        referenceNumber: refNum,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        discountAmount,
        originalAmount: computedTotal
      };
    }, {
      isolationLevel: 'Serializable', // Use strictest isolation for concurrency safety
      maxWait: 5000,
      timeout: 10000
    });

    // 5. CREATE RAZORPAY ORDER (OUTSIDE TRANSACTION TO AVOID HOLDING LOCKS)
    try {
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100),
          currency: 'INR',
          receipt: referenceNumber
        })
      });
      
      const order = await rzpResponse.json();
      if (!order.id) {
        console.error("Razorpay Error:", order);
        throw new Error(order.error?.description || 'Razorpay order creation failed');
      }

      return c.json({ ...booking, orderId: order.id });
    } catch (rzpErr) {
      // If Razorpay fails, immediately release the held room reservation
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'FAILED' }
      });
      throw rzpErr;
    }

  } catch (err) { 
    if (err.message === 'ROOM_UNAVAILABLE') {
      return c.json({ error: 'This sanctuary was just reserved by another traveler. Please select different dates or another room.' }, 409);
    }
    return c.json({ error: err.message }, 500); 
  }
});

// Get booking by reference number (used by CheckoutSuccessPage)
app.get('/bookings/reference/:ref', authMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const ref = c.req.param('ref');
  try {
    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
      include: {
        resort: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            type: true,
            locationArea: true,
            locationLat: true,
            locationLng: true,
            images: true,
            rating: true,
            reviewCount: true,
            pricePerNight: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            pricePerNight: true
          }
        }
      }
    });
    if (!booking) return c.json({ error: 'Booking not found' }, 404);
    return c.json(booking);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/bookings/:ref/verify-payment', authMiddleware, async (c) => {

  const prisma = c.get('getPrisma')(c.env);
  const ref = c.req.param('ref');
  
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  
  console.log('Verify payment called:', { ref, razorpay_payment_id, razorpay_order_id, has_signature: !!razorpay_signature });

  try {
    // 1. Signature Verification using Web Crypto API
    const secret = c.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not set!');
      return c.json({ error: 'Payment configuration error' }, 500);
    }

    let signatureValid = false;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
      const key = await crypto.subtle.importKey(
        'raw', 
        encoder.encode(secret), 
        { name: 'HMAC', hash: 'SHA-256' }, 
        false, 
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, data);
      const generatedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      signatureValid = (generatedSignature === razorpay_signature);
      console.log('Signature check:', { valid: signatureValid, generated: generatedSignature?.substring(0, 10) + '...' });
    } catch (cryptoErr) {
      console.error('Crypto error during verification:', cryptoErr.message);
      return c.json({ error: 'Signature verification failed: ' + cryptoErr.message }, 500);
    }

    if (!signatureValid) {
      return c.json({ error: 'Payment verification failed. Signature mismatch.' }, 400);
    }

    // 2. Find and update booking
    const existingBooking = await prisma.booking.findUnique({
      where: { referenceNumber: ref }
    });
    
    if (!existingBooking) {
      console.error('Booking not found for ref:', ref);
      return c.json({ error: `Booking not found: ${ref}` }, 404);
    }

    const booking = await prisma.booking.update({
      where: { referenceNumber: ref },
      data: { status: 'PAID' },
      include: { resort: true }
    });

    // 3. Create Notification Asynchronously
    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Confirmed!',
          message: `Payment successful for ${booking.resort.name}. Reference: ${ref}`,
          type: 'booking'
        }
      }).catch(notifErr => console.warn('Async notification creation failed:', notifErr.message))
    );

    // 4. Increment coupon usage count & record booking coupon in JSON fallback
    // Extract coupon info from specialRequests since these fields aren't in the Prisma schema
    const couponMatch = booking.specialRequests?.match(/\[Coupon: ([A-Z0-9]+), Discount: Γé╣(\d+)/);
    const extractedCouponCode = couponMatch?.[1] || null;
    const extractedDiscount = couponMatch ? parseInt(couponMatch[2], 10) : 0;

    if (extractedCouponCode) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            await incrementCouponUsage(prisma, extractedCouponCode);
            await recordBookingCoupon(prisma, booking.id, booking.userId, extractedCouponCode, extractedDiscount);
          } catch (err) {
            console.error("Failed to post-process coupon verification in worker:", err);
          }
        })()
      );
    }

    return c.json({ success: true, booking });
  } catch (err) { 
    console.error('Verification Error:', err.message, err.stack);
    return c.json({ error: err.message }, 500); 
  }
});

// --- Coupon & Promotions Section ---
app.post('/coupons/validate', authMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payload = c.get('user');
  const userId = payload?.userId;
  
  try {
    const { code, resortId, originalAmount } = await c.req.json();
    const result = await validateCouponCode(prisma, {
      code,
      userId,
      resortId,
      originalAmount: Number(originalAmount)
    });
    
    if (!result.valid) {
      return c.json({ valid: false, error: result.error }, 400);
    }
    
    return c.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      description: result.coupon.description,
      code: result.coupon.code
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/coupons/apply', authMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payload = c.get('user');
  const userId = payload?.userId;
  
  try {
    const { code, resortId, originalAmount } = await c.req.json();
    const result = await validateCouponCode(prisma, {
      code,
      userId,
      resortId,
      originalAmount: Number(originalAmount)
    });
    
    if (!result.valid) {
      return c.json({ valid: false, error: result.error }, 400);
    }
    
    return c.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      description: result.coupon.description,
      code: result.coupon.code
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Admin Coupons CRUD
app.get('/admin/coupons', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return c.json(coupons);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/admin/coupons', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumAmount,
      maxDiscount,
      usageLimit,
      startsAt,
      expiresAt,
      applicableResortId,
      applicableRole
    } = await c.req.json();

    if (!code || !description || !discountType || discountValue === undefined || !expiresAt) {
      return c.json({ error: 'Required fields: code, description, discountType, discountValue, expiresAt' }, 400);
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await findCouponByCode(prisma, cleanCode);
    if (existing) {
      return c.json({ error: 'Coupon code already exists' }, 400);
    }

    const coupon = await createCouponInDb(prisma, {
      code: cleanCode,
      description,
      discountType,
      discountValue: Number(discountValue),
      minimumAmount: minimumAmount !== undefined ? Number(minimumAmount) : 0,
      maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : null,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : null,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      expiresAt: new Date(expiresAt),
      applicableResortId: applicableResortId || null,
      applicableRole: applicableRole || null
    });

    return c.json(coupon, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.patch('/admin/coupons/:id/toggle', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  try {
    const { active } = await c.req.json();
    const coupon = await updateCouponStatus(prisma, id, Boolean(active));
    return c.json(coupon);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/admin/coupons/:id', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  try {
    await deleteCouponFromDb(prisma, id);
    return c.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/admin/coupons/analytics', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    const bookingsWithCoupons = await prisma.booking.findMany({ where: { couponCode: { not: null } }, select: { couponCode: true, discountAmount: true } });

    let totalDiscountGiven = 0;
    const codeStats = {};

    bookingsWithCoupons.forEach(b => {
      const amt = b.discountAmount || 0;
      totalDiscountGiven += amt;
      
      if (!codeStats[b.couponCode]) {
        codeStats[b.couponCode] = { code: b.couponCode, count: 0, totalDiscount: 0 };
      }
      codeStats[b.couponCode].count += 1;
      codeStats[b.couponCode].totalDiscount += amt;
    });

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    const activeCampaignsCount = coupons.filter(c => c.active).length;

    return c.json({
      activeCampaignsCount,
      totalDiscountGiven,
      couponBookingsCount: bookingsWithCoupons.length,
      couponBreakdown: Object.values(codeStats)
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});


};



