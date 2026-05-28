import { logSecureInfo, logSecureWarn, logSecureError } from './logger.js';

export const auditLogger = {
  logAdminAction: (adminId, action, target, metadata = {}) => {
    logSecureInfo('ADMIN_ACTION', `Admin ${adminId} performed ${action} on ${target}`, metadata);
  },
  
  logKycAction: (adminId, guideId, status, reason = null) => {
    logSecureInfo('KYC_ACTION', `Admin ${adminId} ${status} KYC for guide ${guideId}`, { reason });
  },
  
  logPaymentFailure: (userId, amount, method, reason) => {
    logSecureWarn('PAYMENT_FAILURE', `Payment failed for user ${userId} (${amount})`, { method, reason });
  },
  
  logBookingFailure: (userId, resortId, reason) => {
    logSecureWarn('BOOKING_FAILURE', `Booking failed for user ${userId} at resort ${resortId}`, { reason });
  },
  
  logAuthEvent: (userId, eventType, metadata = {}) => {
    logSecureInfo('AUTH_EVENT', `Auth event ${eventType} for user ${userId}`, metadata);
  },
  
  logSecurityEvent: (ip, eventType, severity, metadata = {}) => {
    const logger = severity === 'HIGH' ? logSecureError : logSecureWarn;
    logger('SECURITY_EVENT', `Security event ${eventType} from IP ${ip}`, metadata);
  }
};
