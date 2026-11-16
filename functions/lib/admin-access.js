'use strict';

function createAdminAccess({ auth, HttpsError, ADMIN_EMAIL, logger }) {
  async function claimAdminRole(request) {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
    const tokenEmail = String(request.auth.token.email || '').trim().toLowerCase();
    const allowedEmail = ADMIN_EMAIL.value().trim().toLowerCase();
    if (!request.auth.token.email_verified || !tokenEmail || tokenEmail !== allowedEmail) {
      logger.warn('Rejected admin claim request', { uid:request.auth.uid });
      throw new HttpsError('permission-denied', 'This Google account is not an EMPATH administrator.');
    }
    const user = await auth.getUser(request.auth.uid);
    await auth.setCustomUserClaims(request.auth.uid, { ...(user.customClaims || {}), admin:true });
    logger.info('Granted EMPATH admin claim', { uid:request.auth.uid });
    return { granted:true };
  }

  return { claimAdminRole };
}

module.exports = { createAdminAccess };
