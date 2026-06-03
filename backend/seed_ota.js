import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const properties = [
    {
      resortName: 'Evolve Back, Hampi (Kamalapura Palace)',
      bookingComUrl: 'https://booking.com/hotel/in/evolve-back',
      agodaUrl: 'https://agoda.com/evolve-back-hampi',
      makemytripUrl: 'https://makemytrip.com/hotels/evolve-back',
      expediaUrl: 'https://expedia.com/evolve-back',
      goibiboUrl: 'https://goibibo.com/hotels/evolve-back',
      airbnbUrl: null,
      detectedChannels: 'Booking.com,Agoda,MakeMyTrip,Expedia,Goibibo',
      reviewVolume: 1245,
      rating: 4.8,
      opportunityScore: 5
    },
    {
      resortName: 'Heritage Resort Hampi',
      bookingComUrl: 'https://booking.com/hotel/in/heritage-resort-hampi',
      agodaUrl: 'https://agoda.com/heritage-resort',
      makemytripUrl: 'https://makemytrip.com/hotels/heritage-resort',
      expediaUrl: null,
      goibiboUrl: 'https://goibibo.com/hotels/heritage-resort',
      airbnbUrl: null,
      detectedChannels: 'Booking.com,Agoda,MakeMyTrip,Goibibo',
      reviewVolume: 856,
      rating: 4.4,
      opportunityScore: 4
    },
    {
      resortName: 'WelcomHeritage Shivavilas Palace',
      bookingComUrl: 'https://booking.com/hotel/in/shivavilas-palace',
      agodaUrl: null,
      makemytripUrl: 'https://makemytrip.com/hotels/shivavilas',
      expediaUrl: 'https://expedia.com/shivavilas',
      goibiboUrl: null,
      airbnbUrl: null,
      detectedChannels: 'Booking.com,MakeMyTrip,Expedia',
      reviewVolume: 532,
      rating: 4.7,
      opportunityScore: 3
    },
    {
      resortName: 'Vijayshree Resort & Heritage Village',
      bookingComUrl: 'https://booking.com/hotel/in/vijayshree-resort',
      agodaUrl: 'https://agoda.com/vijayshree-resort',
      makemytripUrl: 'https://makemytrip.com/hotels/vijayshree-resort',
      expediaUrl: 'https://expedia.com/vijayshree-resort',
      goibiboUrl: 'https://goibibo.com/hotels/vijayshree-resort',
      airbnbUrl: 'https://airbnb.com/rooms/vijayshree',
      detectedChannels: 'Booking.com,Agoda,MakeMyTrip,Expedia,Goibibo,Airbnb',
      reviewVolume: 1890,
      rating: 4.2,
      opportunityScore: 6
    },
    {
      resortName: 'Leo Wooden Resort',
      bookingComUrl: 'https://booking.com/hotel/in/leo-wooden',
      agodaUrl: 'https://agoda.com/leo-wooden',
      makemytripUrl: null,
      expediaUrl: null,
      goibiboUrl: 'https://goibibo.com/hotels/leo-wooden',
      airbnbUrl: 'https://airbnb.com/rooms/leo-wooden',
      detectedChannels: 'Booking.com,Agoda,Goibibo,Airbnb',
      reviewVolume: 420,
      rating: 4.0,
      opportunityScore: 4
    },
    {
      resortName: 'Hampi Heritage & Wilderness Resort',
      bookingComUrl: null,
      agodaUrl: null,
      makemytripUrl: 'https://makemytrip.com/hotels/jungle-lodges',
      expediaUrl: null,
      goibiboUrl: null,
      airbnbUrl: null,
      detectedChannels: 'MakeMyTrip',
      reviewVolume: 156,
      rating: 4.5,
      opportunityScore: 1
    },
    {
      resortName: 'Hampi\'s Feathers Resort',
      bookingComUrl: 'https://booking.com/hotel/in/feathers-resort',
      agodaUrl: 'https://agoda.com/feathers-resort',
      makemytripUrl: null,
      expediaUrl: null,
      goibiboUrl: null,
      airbnbUrl: null,
      detectedChannels: 'Booking.com,Agoda',
      reviewVolume: 230,
      rating: 3.9,
      opportunityScore: 2
    }
  ];

  await prisma.externalPropertyPresence.deleteMany();
  await prisma.externalPropertyPresence.createMany({ data: properties });
  console.log('Seeded ExternalPropertyPresence table.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
