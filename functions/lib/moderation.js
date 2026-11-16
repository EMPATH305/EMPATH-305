'use strict';

const { ALLOWED_COLLECTIONS, validateModerationInput, validateListReportsInput, summarizeTarget } = require('./validation');

function createModeration({ db, HttpsError, FieldPath, FieldValue, Timestamp, logger, ADMIN_APP_CHECK_ENFORCED, MODERATION_AUDIT_RETENTION_MS }) {
  function requireAdmin(request) {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
    if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Admin access is required.');
    return request.auth.uid;
  }


  async function listReports(request) {
    requireAdmin(request);
    const { limit, cursor } = validateListReportsInput(request.data);
    let query = db.collection('content_reports')
      .where('status', '==', 'open')
      .orderBy('createdAt', 'desc')
      .orderBy(FieldPath.documentId(), 'desc');
    if (cursor) {
      query = query.startAfter(Timestamp.fromMillis(cursor.createdAt), cursor.id);
    }
    const snapshot = await query.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const pageDocs = snapshot.docs.slice(0, limit);
    const reports = await Promise.all(pageDocs.map(async item => {
      const data = item.data();
      const targetCollection = ALLOWED_COLLECTIONS.has(data.targetCollection) ? data.targetCollection : '';
      const targetId = typeof data.targetId === 'string' ? data.targetId : '';
      let targetExists = false;
      let preview = '';
      if (targetCollection && targetId) {
        const target = await db.collection(targetCollection).doc(targetId).get();
        targetExists = target.exists;
        preview = target.exists ? summarizeTarget(target.data()) : '[content already removed]';
      }
      return {
        id:item.id,
        targetCollection,
        targetId,
        reason:String(data.reason || 'other'),
        createdAt:data.createdAt?.toMillis?.() || null,
        appVerified:Boolean(data.appVerified),
        targetExists,
        preview
      };
    }));
    const last = pageDocs.at(-1);
    return {
      reports,
      hasMore,
      nextCursor:hasMore && last ? {
        id:last.id,
        createdAt:last.data().createdAt?.toMillis?.() || null
      } : null,
      security:{
        appCheckVerified:Boolean(request.app),
        appCheckEnforced:ADMIN_APP_CHECK_ENFORCED
      }
    };
  }

  async function moderateReport(request) {
    const moderatorUid = requireAdmin(request);
    const input = validateModerationInput(request.data);
    if (!input) throw new HttpsError('invalid-argument', 'Invalid moderation action.');
    const reportRef = db.collection('content_reports').doc(input.reportId);
    const auditRef = db.collection('moderation_audit').doc();
    await db.runTransaction(async transaction => {
      const reportSnapshot = await transaction.get(reportRef);
      if (!reportSnapshot.exists) throw new HttpsError('not-found', 'Report not found.');
      const report = reportSnapshot.data();
      if ((report.status || 'open') !== 'open') {
        throw new HttpsError('failed-precondition', 'This report has already been reviewed.');
      }
      if (input.action === 'remove') {
        if (!ALLOWED_COLLECTIONS.has(report.targetCollection) || typeof report.targetId !== 'string') {
          throw new HttpsError('failed-precondition', 'The report target is invalid.');
        }
        transaction.delete(db.collection(report.targetCollection).doc(report.targetId));
      }
      transaction.update(reportRef, {
        status:input.action === 'remove' ? 'removed' : 'dismissed',
        moderationAction:input.action,
        moderatedAt:FieldValue.serverTimestamp(),
        moderatorUid
      });
      transaction.set(auditRef, {
        reportId:input.reportId,
        action:input.action,
        targetCollection:String(report.targetCollection || ''),
        targetId:String(report.targetId || ''),
        moderatorUid,
        createdAt:FieldValue.serverTimestamp(),
        expireAt:Timestamp.fromMillis(Date.now() + MODERATION_AUDIT_RETENTION_MS)
      });
    });
    logger.info('Content report moderated', { reportId:input.reportId, action:input.action, moderatorUid });
    return { completed:true };
  }

  return { listReports, moderateReport };
}

module.exports = { createModeration };
