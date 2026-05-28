// Sentry abstraction for Cloudflare Workers (using Toucan-js or native Sentry edge)
// Currently abstracted to prevent breaking if SDK is not installed yet.

export class SentryMonitor {
  constructor(env, request) {
    this.env = env;
    this.isEnabled = !!env.SENTRY_DSN;
    
    // In a real environment, initialize Toucan:
    // if (this.isEnabled) {
    //   this.sentry = new Toucan({
    //     dsn: env.SENTRY_DSN,
    //     request,
    //     environment: env.NODE_ENV || 'production',
    //     release: 'hampistays-api@1.0.0',
    //   });
    // }
  }

  captureException(err, context = {}) {
    if (!this.isEnabled) {
      console.error('[SENTRY_MOCK_EXCEPTION]', err, context);
      return;
    }
    // this.sentry.setExtras(context);
    // this.sentry.captureException(err);
    console.log('[SENTRY_TRACKED_EXCEPTION]', err.message, context);
  }

  captureMessage(message, level = 'info', context = {}) {
    if (!this.isEnabled) {
      console.log(`[SENTRY_MOCK_MESSAGE:${level}]`, message, context);
      return;
    }
    // this.sentry.setExtras(context);
    // this.sentry.captureMessage(message, level);
    console.log(`[SENTRY_TRACKED_MESSAGE:${level}]`, message, context);
  }

  setUser(user) {
    if (!this.isEnabled || !user) return;
    // PII masking for Sentry
    const safeUser = {
      id: user.id,
      role: user.role,
      // Masked email for debugging, never full PII
      email: user.email ? user.email.replace(/(.{2})(.*)(?=@)/, '$1***') : undefined
    };
    // this.sentry.setUser(safeUser);
    console.log('[SENTRY_SET_USER]', safeUser);
  }

  setTag(key, value) {
    if (!this.isEnabled) return;
    // this.sentry.setTag(key, value);
  }
}
