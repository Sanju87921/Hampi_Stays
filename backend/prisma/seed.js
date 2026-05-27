import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 0. Clear existing data for a clean slate
  console.log('🧹 Cleaning database...');
  await prisma.booking.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.room.deleteMany();
  await prisma.resort.deleteMany();
  await prisma.resortOwner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 0.5 Initialize System Settings
  await prisma.systemSettings.create({
    data: {
      guideServiceEnabled: true,
    }
  });
  console.log('✅ Initialized system settings');

  // 1. Create a Luxury Owner Account
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const owner = await prisma.user.create({
    data: {
      email: 'admin@hampistays.com',
      name: 'HampiStays Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const ownerProfile = await prisma.resortOwner.create({
    data: {
      userId: owner.id,
      businessName: 'HampiStays Luxury Collection',
      isVerified: true,
    }
  });

  console.log('✅ Created luxury owner account and profile');

  // 2. Define Resorts Data
  const resorts = [
    {
      slug: "evolve-back-kamalapura",
      name: "Evolve Back Kamalapura Palace",
      tagline: "Where the Vijayanagara Empire Meets World-Class Luxury",
      description: "Nestled against the dramatic backdrop of Hampi's boulder-strewn landscape, Evolve Back Kamalapura Palace is the pinnacle of luxury heritage stays. Each villa blends ancient Dravidian architecture with contemporary comfort — private plunge pools, handcrafted interiors, and a dedicated butler service ensure an unmatched experience. A CGH Earth property.",
      type: "luxury",
      locationArea: "Kamalapura",
      locationLat: 15.3238,
      locationLng: 76.4575,
      images: [
        "https://images.unsplash.com/photo-1636903684031-e187417f3e77?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1591536098930-d571deee309a?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/flagged/photo-1582271542392-c4ca315c0663?auto=format&fit=crop&q=80&w=2000"
      ],
      amenities: ["Pool", "Spa", "Restaurant", "Bar", "WiFi", "Air Conditioning", "Airport Transfer", "Yoga"],
      rating: 4.9,
      reviewCount: 248,
      pricePerNight: 31000,
      isFeatured: true,
      isVerified: true,
      categories: ["Heritage", "Boutique", "Temple View"],
      roomTypes: {
        create: [
          {
            name: "Nivasa Heritage Villa",
            description: "A grand villa with private plunge pool and panoramic heritage views of Hampi ruins.",
            pricePerNight: 31000,
            capacity: 2,
            amenities: ["Pool", "Air Conditioning", "WiFi"],
            images: ["https://images.unsplash.com/photo-1636903684031-e187417f3e77?auto=format&fit=crop&q=80&w=2000"],
            availableCount: 5,
          },
          {
            name: "Jal Mahal Suite",
            description: "The ultimate indulgence — an overwater suite with a dedicated butler and infinity pool.",
            pricePerNight: 47000,
            capacity: 4,
            amenities: ["Pool", "Spa", "Air Conditioning", "WiFi", "Airport Transfer"],
            images: ["https://images.unsplash.com/photo-1591536098930-d571deee309a?auto=format&fit=crop&q=80&w=2000"],
            availableCount: 2,
          }
        ]
      }
    },
    {
      slug: "hampis-boulders-resort",
      name: "Hampi's Boulders Resort & Spa",
      tagline: "Serenity at the Edge of the Sacred Tungabhadra",
      description: "Built harmoniously between the ancient granite boulders of the Tungabhadra riverbank, Hampi's Boulders Resort offers an eco-conscious retreat without compromising on comfort. Cascading gardens, an Ayurvedic spa, and open-air yoga pavilions make this a sanctuary for the soul.",
      type: "eco",
      locationArea: "Nimbapura, Tungabhadra Riverbank",
      locationLat: 15.3380,
      locationLng: 76.4610,
      images: [
        "https://images.unsplash.com/photo-1581488613801-68d36242d412?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=80&w=2000"
      ],
      amenities: ["River View", "Spa", "Yoga", "Organic Food", "WiFi", "Cycling", "Guided Tours"],
      rating: 4.8,
      reviewCount: 312,
      pricePerNight: 9500,
      isFeatured: true,
      isVerified: true,
      categories: ["Riverside", "Nature"],
      roomTypes: {
        create: [
          {
            name: "Boulder Cottage",
            description: "A natural stone cottage nestled between ancient granite boulders with river views.",
            pricePerNight: 9500,
            capacity: 2,
            amenities: ["WiFi", "River View"],
            images: ["https://images.unsplash.com/photo-1581488613801-68d36242d412?auto=format&fit=crop&q=80&w=2000"],
            availableCount: 8,
          }
        ]
      }
    },
    {
      slug: "heritage-resort-hampi",
      name: "Heritage Resort Hampi",
      tagline: "Authentic Hampi Living, Thoughtfully Curated",
      description: "Celebrating local Vijayanagara architecture and sustainable living. Hand-woven textiles, farm-to-table meals, and guided heritage walks give guests an intimate, authentic connection to the ancient city.",
      type: "heritage",
      locationArea: "Kamalapura Road",
      locationLat: 15.3450,
      locationLng: 76.4700,
      images: [
        "https://images.unsplash.com/photo-1591536098930-d571deee309a?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1642516863984-68fdeea5ba64?auto=format&fit=crop&q=80&w=2000"
      ],
      amenities: ["Heritage View", "Organic Food", "Guided Tours", "WiFi", "Campfire"],
      rating: 4.6,
      reviewCount: 189,
      pricePerNight: 7500,
      isFeatured: false,
      isVerified: true,
      categories: ["Heritage", "Nature"],
      roomTypes: {
        create: [
          {
            name: "Heritage Room",
            description: "A cozy room with traditional décor and views of the resort's heritage gardens.",
            pricePerNight: 7500,
            capacity: 2,
            amenities: ["WiFi", "Heritage View"],
            images: ["https://images.unsplash.com/photo-1591536098930-d571deee309a?auto=format&fit=crop&q=80&w=2000"],
            availableCount: 10,
          }
        ]
      }
    },
    {
      slug: "clarks-inn-hampi",
      name: "Clarks Inn Hampi",
      tagline: "Comfortable, Central, and Completely Hassle-Free",
      description: "A reliable and well-located 3-star hotel near Kamalapura. Clean rooms, a good restaurant serving local Karnataka cuisine, and a rooftop with iconic boulder views.",
      type: "budget",
      locationArea: "Kamalapura",
      locationLat: 15.3260,
      locationLng: 76.4590,
      images: [
        "https://images.unsplash.com/photo-1588319648913-0ff4b76a9fed?auto=format&fit=crop&q=80&w=2000"
      ],
      amenities: ["Rooftop", "WiFi", "Restaurant", "Parking", "Air Conditioning"],
      rating: 4.2,
      reviewCount: 420,
      pricePerNight: 3500,
      isFeatured: false,
      isVerified: true,
      categories: ["Heritage"],
      roomTypes: {
        create: [
          {
            name: "Standard Room",
            description: "A clean and comfortable room with all modern amenities and AC.",
            pricePerNight: 3500,
            capacity: 2,
            amenities: ["WiFi", "Air Conditioning"],
            images: ["https://images.unsplash.com/photo-1588319648913-0ff4b76a9fed?auto=format&fit=crop&q=80&w=2000"],
            availableCount: 15,
          }
        ]
      }
    }
  ];

  // 3. Create Resorts (One owner per resort)
  let index = 1;
  for (const resortData of resorts) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    // Create unique owner for this resort
    const resortOwnerUser = await prisma.user.create({
      data: {
        email: `owner${index}@hampistays.com`,
        name: `${resortData.name} Owner`,
        passwordHash,
        role: 'RESORT_OWNER',
      },
    });

    const profile = await prisma.resortOwner.create({
      data: {
        userId: resortOwnerUser.id,
        businessName: `${resortData.name} Ventures`,
        isVerified: true,
      }
    });

    await prisma.resort.create({
      data: {
        ...resortData,
        ownerId: profile.id,
        status: 'APPROVED'
      },
    });
    
    console.log(`✅ Seeded ${resortData.name} with unique owner`);
    index++;
  }

  // 4. Create Travelers
  const travelers = [
    { email: 'sanjay@example.com', name: 'Sanjay Kumar' },
    { email: 'ananya@example.com', name: 'Ananya Sharma' },
    { email: 'rahul@example.com', name: 'Rahul Verma' }
  ];

  const seededTravelers = [];
  for (const t of travelers) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    const user = await prisma.user.create({
      data: {
        ...t,
        passwordHash,
        role: 'TRAVELLER',
      }
    });
    seededTravelers.push(user);
    console.log(`✅ Seeded Traveler: ${t.name}`);
  }

  // 5. Create Pending Resorts (for Admin to review)
  const pendingResorts = [
    {
      slug: "hampi-riverside-camp",
      name: "Hampi Riverside Eco Camp",
      tagline: "Waking up to the sound of Tungabhadra",
      description: "A rustic yet comfortable camping experience right on the banks of the river. Perfect for backpackers and nature lovers who want to experience Hampi's raw beauty.",
      type: "eco",
      locationArea: "Virupapur Gaddi (Hampi Island)",
      locationLat: 15.3400,
      locationLng: 76.4550,
      images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=2000"],
      amenities: ["River Access", "Campfire", "Shared Cafe", "Basic WiFi"],
      pricePerNight: 2500,
      status: 'PENDING',
      categories: ["Riverside", "Nature"]
    }
  ];

  const pendingOwnerSalt = await bcrypt.genSalt(10);
  const pendingOwnerHash = await bcrypt.hash('password123', pendingOwnerSalt);
  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending_owner@example.com',
      name: 'Ravi Prakash',
      passwordHash: pendingOwnerHash,
      role: 'RESORT_OWNER'
    }
  });

  const pendingProfile = await prisma.resortOwner.create({
    data: {
      userId: pendingUser.id,
      businessName: 'Riverside Adventures',
      isVerified: false
    }
  });

  for (const r of pendingResorts) {
    await prisma.resort.create({
      data: {
        ...r,
        ownerId: pendingProfile.id
      }
    });
  }
  console.log('✅ Seeded pending resort for admin review');

  // 6. Create some Bookings
  const allResorts = await prisma.resort.findMany({ where: { status: 'APPROVED' }, include: { roomTypes: true } });
  
  if (allResorts.length > 0 && seededTravelers.length > 0) {
    for (let i = 0; i < 3; i++) {
      const resort = allResorts[i % allResorts.length];
      const traveler = seededTravelers[i % seededTravelers.length];
      const room = resort.roomTypes[0];
      
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + (i * 5) + 2);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3);

      await prisma.booking.create({
        data: {
          userId: traveler.id,
          resortId: resort.id,
          roomId: room?.id,
          checkIn,
          checkOut,
          guests: 2,
          totalPrice: (room?.pricePerNight || 5000) * 3,
          status: i === 0 ? 'CONFIRMED' : 'PENDING',
          referenceNumber: `HS-SEED-${Math.random().toString(36).substring(7).toUpperCase()}`
        }
      });
    }
    console.log('✅ Seeded sample bookings');
  }

  // 7. Create Guides and Experiences
  console.log('👨‍🏫 Seeding guides and experiences...');
  const guideUser = await prisma.user.create({
    data: {
      email: 'guide@hampistays.com',
      name: 'Krishna Deva',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'GUIDE',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop'
    }
  });

  const guideProfile = await prisma.guideProfile.create({
    data: {
      userId: guideUser.id,
      bio: "Certified historian and Hampi native with over 15 years of experience uncovering the hidden secrets of the Vijayanagara Empire.",
      specialties: ["History", "Architecture", "Mythology"],
      languages: ["English", "Hindi", "Kannada", "Telugu"],
      pricePerDay: 3500,
      pricePerHour: 500,
      yearsExperience: 15,
      isVerified: true,
      rating: 4.9,
      reviewCount: 124
    }
  });

  const experienceData = [
    {
      title: "Sunrise Spiritual Walk",
      description: "Witness the first rays of sun hitting the Virupaksha temple gopuram. A journey through ancient rituals, secret water systems, and the living traditions of Hampi.",
      price: 1200,
      durationHours: 3,
      meetingPoint: "Virupaksha Temple Main Entrance",
      images: ["https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?q=80&w=2070&auto=format&fit=crop"],
      includes: ["Traditional Breakfast", "Temple Entrance Fees", "Audio Guide"]
    },
    {
      title: "The Forgotten Empire: Cycle Tour",
      description: "Explore the vast Royal Enclosure on two wheels. Visit the Lotus Mahal, Elephant Stables, and the Queen's Bath while learning about the daily life of Vijayanagara royals.",
      price: 1800,
      durationHours: 5,
      meetingPoint: "Kamalapura Museum",
      images: ["https://images.unsplash.com/photo-1545105511-921090367201?q=80&w=2070&auto=format&fit=crop"],
      includes: ["Bicycle Rental", "Mineral Water", "Helmet"]
    },
    {
      title: "Twilight Photography Expedition",
      description: "Capture Hampi's boulder-strewn landscape in the golden hour. A specialized tour for photographers focusing on composition and the interplay of light on ancient granite.",
      price: 2500,
      durationHours: 4,
      meetingPoint: "Hemakuta Hill Entrance",
      images: ["https://images.unsplash.com/photo-1581391528803-5eba57ac1f2d?q=80&w=2070&auto=format&fit=crop"],
      includes: ["Photography Tips", "Tripod Rental", "Snacks"]
    }
  ];

  for (const exp of experienceData) {
    await prisma.experience.create({
      data: {
        ...exp,
        guideId: guideProfile.id
      }
    });
  }
  console.log('✅ Seeded guides and experiences');

  // 8. Seeding Coupons
  console.log('🎫 Seeding coupons...');
  
  // Check if DB supports Coupon model
  let useDbCoupons = false;
  try {
    if (prisma.coupon) {
      await prisma.coupon.deleteMany();
      useDbCoupons = true;
    }
  } catch (e) {
    console.log('⚠️  DB does not support Coupon table. Seeding coupons to local JSON store instead.');
  }

  const evolveBack = await prisma.resort.findFirst({ where: { slug: 'evolve-back-kamalapura' } });

  const couponsData = [
    {
      code: 'WELCOME10',
      description: 'Get 10% off on your retreat, up to ₹2,000.',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minimumAmount: 5000,
      maxDiscount: 2000,
      usageLimit: 500,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      active: true
    },
    {
      code: 'FIRSTSTAY',
      description: 'Exclusive ₹1,500 off on your very first booking at HampiStays.',
      discountType: 'FIXED',
      discountValue: 1500,
      minimumAmount: 8000,
      usageLimit: 1000,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true
    },
    {
      code: 'VIPSTAYS',
      description: 'Elite 20% off for VIP travellers, up to ₹5,000.',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minimumAmount: 15000,
      maxDiscount: 5000,
      applicableRole: 'TRAVELLER',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true
    },
    {
      code: 'HAMPIFEST',
      description: 'Seasonal celebration: 15% off up to ₹3,000.',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumAmount: 10000,
      maxDiscount: 3000,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true
    }
  ];

  if (evolveBack) {
    couponsData.push({
      code: 'KAMALAPURA25',
      description: 'Exclusive ₹2,500 off on suites at Evolve Back Kamalapura Palace.',
      discountType: 'FIXED',
      discountValue: 2500,
      minimumAmount: 20000,
      applicableResortId: evolveBack.id,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true
    });
  }

  if (useDbCoupons) {
    for (const c of couponsData) {
      await prisma.coupon.create({ data: c });
    }
    console.log('✅ Seeded coupons to database successfully');
  } else {
    // Write to server/data/coupons.json
    try {
      const targetDir = path.join(process.cwd(), 'server/data');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const couponsFile = path.join(targetDir, 'coupons.json');
      
      const fileCoupons = couponsData.map((c, i) => ({
        id: `wel-${i}`,
        ...c,
        usedCount: 0,
        startsAt: c.startsAt.toISOString(),
        expiresAt: c.expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      fs.writeFileSync(couponsFile, JSON.stringify(fileCoupons, null, 2), 'utf8');
      console.log('✅ Seeded coupons to local JSON store successfully');
    } catch (err) {
      console.error('❌ Failed to write local coupons JSON file:', err.message);
    }
  }

  console.log('🚀 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
