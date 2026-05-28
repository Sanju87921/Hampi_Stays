import { getPrisma } from '../../config/prisma.js';
import { AlgoliaClient } from '../algolia/client.js';
import { calculateRankingScores } from '../ranking/rankingEngine.js';

export class ResortIndexer {
  constructor(env) {
    this.prisma = getPrisma(env);
    this.algolia = new AlgoliaClient(env);
  }

  formatForAlgolia(resort) {
    const scores = calculateRankingScores(resort);
    
    // Convert amenities to an array of strings for easy faceting
    const amenitiesList = Array.isArray(resort.amenities) 
      ? resort.amenities.map(a => typeof a === 'object' ? a.name : a)
      : [];

    return {
      objectID: resort.id,
      name: resort.name,
      description: resort.description,
      location: resort.location,
      category: resort.category || 'Standard',
      amenities: amenitiesList,
      priceRange: this.calculatePriceRange(resort.rooms),
      rating: resort.rating || 0,
      reviewsCount: resort.reviewsCount || 0,
      bookingsCount: resort.bookingsCount || 0,
      images: resort.images || [],
      isFeatured: resort.isFeatured || false,
      isSponsored: resort.isSponsored || false,
      featuredScore: scores.featuredScore,
      sponsoredScore: scores.sponsoredScore,
      _geoloc: resort.latitude && resort.longitude ? {
        lat: parseFloat(resort.latitude),
        lng: parseFloat(resort.longitude)
      } : undefined
    };
  }

  calculatePriceRange(rooms) {
    if (!rooms || rooms.length === 0) return 'Unknown';
    const prices = rooms.map(r => r.price).filter(p => typeof p === 'number');
    if (prices.length === 0) return 'Unknown';
    const min = Math.min(...prices);
    if (min < 3000) return 'Budget';
    if (min < 8000) return 'Mid-Range';
    return 'Luxury';
  }

  async indexAllActiveResorts() {
    const resorts = await this.prisma.resort.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      include: {
        rooms: true,
      }
    });

    const algoliaObjects = resorts.map(r => this.formatForAlgolia(r));
    await this.algolia.saveResorts(algoliaObjects);
    return algoliaObjects.length;
  }

  async indexResort(resortId) {
    const resort = await this.prisma.resort.findUnique({
      where: { id: resortId },
      include: { rooms: true }
    });
    
    if (resort && resort.status === 'APPROVED' && !resort.deletedAt) {
      await this.algolia.saveResorts([this.formatForAlgolia(resort)]);
    } else {
      await this.algolia.deleteResort(resortId);
    }
  }
}
