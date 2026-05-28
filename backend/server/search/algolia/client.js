import algoliasearch from 'algoliasearch';
import { logSecureError } from '../../logging/logger.js';

export class AlgoliaClient {
  constructor(env) {
    this.appId = env.ALGOLIA_APP_ID;
    this.apiKey = env.ALGOLIA_ADMIN_KEY;
    this.isEnabled = !!(this.appId && this.apiKey);

    if (this.isEnabled) {
      this.client = algoliasearch(this.appId, this.apiKey);
      this.resortIndex = this.client.initIndex('resorts');
      this.experienceIndex = this.client.initIndex('experiences');
    }
  }

  async configureIndices() {
    if (!this.isEnabled) return;
    try {
      await this.resortIndex.setSettings({
        searchableAttributes: [
          'name',
          'description',
          'location',
          'category',
          'amenities',
        ],
        customRanking: [
          'desc(featuredScore)',
          'desc(sponsoredScore)',
          'desc(rating)',
          'desc(bookingsCount)'
        ],
        attributesForFaceting: [
          'category',
          'amenities',
          'priceRange',
          'rating',
          'location',
          'isFeatured',
          'isSponsored'
        ],
        typoTolerance: 'min',
        ignorePlurals: true,
      });
    } catch (err) {
      logSecureError('ALGOLIA_CONFIG_ERROR', 'Failed to configure Algolia settings', { error: err.message });
    }
  }

  async saveResorts(resorts) {
    if (!this.isEnabled) return;
    try {
      await this.resortIndex.saveObjects(resorts);
    } catch (err) {
      logSecureError('ALGOLIA_INDEX_ERROR', 'Failed to index resorts', { error: err.message });
    }
  }

  async deleteResort(objectID) {
    if (!this.isEnabled) return;
    try {
      await this.resortIndex.deleteObject(objectID);
    } catch (err) {
      logSecureError('ALGOLIA_DELETE_ERROR', `Failed to delete resort ${objectID}`, { error: err.message });
    }
  }
}
