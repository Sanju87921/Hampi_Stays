import { logSecureError } from '../logging/logger.js';

export class AlertingSystem {
  constructor(env) {
    this.discordWebhook = env.DISCORD_ALERT_WEBHOOK;
    this.slackWebhook = env.SLACK_ALERT_WEBHOOK;
    this.envName = env.NODE_ENV || 'production';
  }

  async sendAlert(level, title, message, metadata = {}) {
    if (!this.discordWebhook && !this.slackWebhook) {
      console.log(`[ALERT:${level}] ${title}: ${message}`, metadata);
      return;
    }

    const payload = {
      content: `**[${level.toUpperCase()}] ${title}** (${this.envName})\n${message}\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``
    };

    try {
      if (this.discordWebhook) {
        await fetch(this.discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (this.slackWebhook) {
        await fetch(this.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: payload.content })
        });
      }
    } catch (err) {
      logSecureError('ALERT_DELIVERY_FAILURE', 'Failed to deliver webhook alert', { error: err.message, originalAlert: title });
    }
  }

  async alertHighLatency(endpoint, latencyMs) {
    await this.sendAlert('warning', 'High API Latency Detected', `Endpoint ${endpoint} took ${latencyMs}ms to respond.`, { endpoint, latencyMs });
  }

  async alertPaymentFailureSpike(count, windowMs) {
    await this.sendAlert('critical', 'Payment Failure Spike', `Detected ${count} payment failures in the last ${windowMs / 1000} seconds. Please check Razorpay integration.`);
  }

  async alertDatabaseError(errorMsg, code) {
    await this.sendAlert('critical', 'Database Error', `Prisma encountered a severe error: ${errorMsg}`, { code });
  }
}
