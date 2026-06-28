const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String, required: true },
    action:     { type: String, required: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId },
    targetModel:{ type: String },
    details:    { type: mongoose.Schema.Types.Mixed, default: {} },
    ip:         { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
