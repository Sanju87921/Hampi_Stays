import prisma from '../utils/prisma.js';
import { Resend } from 'resend';
import { generateSignedKycUrl, verifySignedKycUrl } from '../utils/crypto.js';
import { runKycFraudCheck } from '../utils/fraud.js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';


export const getStats = async (req, res, next) => {
  try {
    const [userCount, resortCount, bookingCount, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        where: {
          status: {
            in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']
          }
        },
        select: {
          totalPrice: true,
          commissionRate: true
        }
      })
    ]);

    const totalRevenue = revenueData.reduce((sum, b) => sum + b.totalPrice, 0);
    const platformEarnings = revenueData.reduce((sum, b) => sum + (b.totalPrice * (b.commissionRate / 100)), 0);

    res.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue,
      platformEarnings: platformEarnings,
      platformRating: 4.8,
      avgBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0,
      cancellationRate: 4.2 // Mock for now
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        kycStatus: true
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { userId: id } }),
      prisma.wishlist.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getPendingResorts = async (req, res, next) => {
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

    res.json(mappedResorts);
  } catch (error) {
    next(error);
  }
};

export const getActiveResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
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

    res.json(mappedResorts);
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
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
            role: true,
            avatar: true,
            phone: true,
            kycStatus: true
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
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export const getAllGuides = async (req, res, next) => {
  try {
    const guides = await prisma.guideProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const securedGuides = guides.map(guide => {
      const secured = { ...guide };
      if (guide.idImage) {
        secured.idImage = generateSignedKycUrl(guide.id);
      }
      return secured;
    });

    res.json(securedGuides);
  } catch (error) {
    next(error);
  }
};

export const updateResortStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resort = await prisma.resort.update({
      where: { id },
      data: { status },
      include: { owner: { include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true } } } } }
    });
    res.json(resort);
  } catch (error) {
    next(error);
  }
};

export const getPayouts = async (req, res, next) => {
  try {
    res.json([]); // Placeholder for payouts system
  } catch (error) {
    next(error);
  }
};

export const getSecurityStats = async (req, res, next) => {
  try {
    res.json({ logs: [], activeSessions: 1 }); // Placeholder
  } catch (error) {
    next(error);
  }
};

export const getFlaggedReviews = async (req, res, next) => {
  try {
    res.json([]); // Placeholder
  } catch (error) {
    next(error);
  }
};

export const getOtpLogs = async (req, res, next) => {
  try {
    res.json([]); // Placeholder
  } catch (error) {
    next(error);
  }
};

/**
 * System Settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { guideServiceEnabled } = req.body;
    
    // Use upsert or findFirst then update to manage the single settings record
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { guideServiceEnabled }
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: { guideServiceEnabled }
      });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Guide Visibility Management
 */
export const toggleGuideActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const guide = await prisma.guideProfile.update({
      where: { id },
      data: { isActive },
      include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true } } }
    });
    
    res.json(guide);
  } catch (error) {
    next(error);
  }
};

export const toggleAllGuides = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    await prisma.guideProfile.updateMany({
      data: { isActive }
    });
    
    res.json({ success: true, isActive });
  } catch (error) {
    next(error);
  }
};

export const updateGuideStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Fetch existing guide profile for audit log baseline
    const existingGuide = await prisma.guideProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingGuide) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const previousStatus = existingGuide.status;

    // Run KYC Fraud check dynamically
    let fraudScore = 0;
    let fraudFlags = [];
    if (existingGuide.userId && existingGuide.idNumber) {
      const fraudCheck = await runKycFraudCheck(existingGuide.userId, existingGuide.idNumber, existingGuide.idImage);
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
      await prisma.verificationAudit.create({
        data: {
          adminId: req.user.userId,
          adminName: req.user.email || 'Admin',
          targetUserId: guide.userId,
          targetName: guide.user.name || 'Local Guide',
          targetType: 'GUIDE',
          action: status,
          rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Identity document was unreadable or invalid.') : null,
          previousStatus,
          newStatus: status,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });

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
      if (resend && guide.user.email) {
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

        try {
          await resend.emails.send({
            from: emailFrom,
            to: toEmail,
            subject: emailSubject,
            html: emailHtml
          });
          console.log(`✅ KYC status email sent to ${toEmail} successfully.`);
        } catch (emailErr) {
          console.error('❌ Failed to send KYC verification email:', emailErr);
        }
      }
    }

    res.json(guide);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle verification of signed KYC image links and redirect to target secure URL
 */
export const getSignedKycImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expires, token } = req.query;

    if (!verifySignedKycUrl(id, expires, token)) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired signature' });
    }

    let idImage = null;
    const guide = await prisma.guideProfile.findUnique({ where: { id } });
    if (guide && guide.idImage) {
      idImage = guide.idImage;
    } else {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user && user.idImage) {
        idImage = user.idImage;
      }
    }

    if (!idImage) {
      return res.status(404).json({ error: 'KYC Document not found' });
    }

    let redirectUrl = idImage;
    if (req.query.transform && redirectUrl.includes('cloudinary.com')) {
      redirectUrl = redirectUrl.replace('/upload/', `/upload/${req.query.transform}/`);
    }

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all verification audit logs
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.verificationAudit.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

