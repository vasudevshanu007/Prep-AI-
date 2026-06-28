const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, action, targetId, targetModel, details }) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    await AuditLog.create({
      adminId:    req.user._id,
      adminEmail: req.user.email,
      action,
      targetId,
      targetModel,
      details: details || {},
      ip,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

module.exports = logAudit;
