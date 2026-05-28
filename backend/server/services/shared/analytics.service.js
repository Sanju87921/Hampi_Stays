import { logSecureError } from '../../logging/logger.js';

export class SharedAnalyticsService {
  constructor(env) {
    this.posthogApiKey = env.POSTHOG_API_KEY;
    this.posthogHost = env.POSTHOG_HOST || 'https://app.posthog.com';
    this.isEnabled = !!this.posthogApiKey;
  }

  async trackEvent(distinctId, eventName, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[ANALYTICS_MOCK] ${eventName} for ${distinctId}`, properties);
      return;
    }

    try {
      await fetch(`${this.posthogHost}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.posthogApiKey,
          event: eventName,
          distinct_id: distinctId,
          properties: {
            ...properties,
            $source: 'backend_api'
          },
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      logSecureError('ANALYTICS_FAILURE', `Failed to send event ${eventName} to PostHog`, { error: err.message });
    }
  }

  async trackBookingAttempt(userId, resortId, dates) {
    await this.trackEvent(userId, 'booking_attempt', { resortId, dates });
  }

  async trackBookingSuccess(userId, bookingId, amount) {
    await this.trackEvent(userId, 'booking_success', { bookingId, amount });
  }

  async trackPaymentFailure(userId, amount, method) {
    await this.trackEvent(userId, 'payment_failure', { amount, method });
  }

  async trackSignup(userId, role, method) {
    await this.trackEvent(userId, 'user_signup', { role, method });
  }
}
