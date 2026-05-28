import posthog from 'posthog-js';

export const initAnalytics = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  if (!apiKey) {
    console.warn('[ANALYTICS] PostHog disabled locally. No API Key.');
    return;
  }

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog_instance) => {
      if (import.meta.env.MODE === 'development') posthog_instance.debug();
    },
    autocapture: false, // We will manually track funnels for privacy compliance
    capture_pageview: true,
  });

  console.log('[ANALYTICS] PostHog Initialized.');
};

export const trackFrontendEvent = (eventName: string, properties?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_API_KEY) {
    posthog.capture(eventName, {
      ...properties,
      $source: 'frontend_web'
    });
  } else {
    console.log(`[ANALYTICS_MOCK_EVENT] ${eventName}`, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_API_KEY) {
    posthog.identify(userId, traits);
  }
};

export const resetAnalytics = () => {
  if (import.meta.env.VITE_POSTHOG_API_KEY) {
    posthog.reset();
  }
};

// Common Funnels
export const trackSignupStep = (step: string, method: string) => {
  trackFrontendEvent('signup_funnel_step', { step, method });
};

export const trackBookingStep = (step: string, resortId: string) => {
  trackFrontendEvent('booking_funnel_step', { step, resortId });
};
