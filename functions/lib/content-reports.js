'use strict';

const { validateReportInput } = require('./validation');

function createContentReports({ db, HttpsError, FieldValue, Timestamp, logger, enforceReportLimit, CONTENT_REPORT_RETENTION_MS }) {
  async function submitContentReport(request) {
    const report = validateReportInput(request.data);
    if (!report) throw new HttpsError('invalid-argument', 'Invalid report.');
    await enforceReportLimit(request);
    const now = Date.now();
    const target = await db.collection(report.targetCollection).doc(report.targetId).get();
    if (!target.exists) throw new HttpsError('not-found', 'The reported content no longer exists.');
    const result = await db.collection('content_reports').add({
      ...report,
      status:'open',
      appVerified:Boolean(request.app),
      createdAt:FieldValue.serverTimestamp(),
      expireAt:Timestamp.fromMillis(now + CONTENT_REPORT_RETENTION_MS)
    });
    logger.info('Anonymous content report created', {
      reportId:result.id,
      targetCollection:report.targetCollection,
      appVerified:Boolean(request.app)
    });
    return { accepted:true };
  }

  return { submitContentReport };
}

module.exports = { createContentReports };
