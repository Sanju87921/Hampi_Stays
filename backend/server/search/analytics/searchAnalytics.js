import { logSecureInfo } from '../../logging/logger.js';
import { SharedAnalyticsService } from '../../services/shared/analytics.service.js';

export class SearchAnalytics {
  constructor(env) {
    this.analytics = new SharedAnalyticsService(env);
  }

  async trackSearchQuery(userId = 'anonymous', query, filterCount, resultCount) {
    // Log for internal Kibana/DataDog equivalents
    logSecureInfo('SEARCH_QUERY', `Search executed: "${query}"`, {
      userId,
      filterCount,
      resultCount
    });

    // Send to PostHog for business funnel tracking
    await this.analytics.trackEvent(userId, 'search_executed', {
      query,
      filterCount,
      resultCount,
      isZeroResult: resultCount === 0
    });
  }

  async trackSearchClick(userId = 'anonymous', resortId, query, position) {
    await this.analytics.trackEvent(userId, 'search_result_clicked', {
      resortId,
      query,
      position
    });
  }
}
