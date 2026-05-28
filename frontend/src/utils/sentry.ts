// Abstracted Sentry initialization for Frontend
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[SENTRY] Sentry is disabled locally. No DSN provided.');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
    environment: import.meta.env.MODE || 'production',
  });

  console.log('[SENTRY] Initialized successfully.');
};

export const captureFrontendError = (error: Error, context?: Record<string, any>) => {
  console.error('[FRONTEND_ERROR]', error, context);
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

export const setSentryUser = (user: { id: string; email: string; role: string }) => {
  if (import.meta.env.VITE_SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id,
      role: user.role,
      // Masking email on frontend sentry payload
      email: user.email.replace(/(.{2})(.*)(?=@)/, '$1***')
    });
  }
};
