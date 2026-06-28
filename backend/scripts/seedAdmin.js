/**
 * Run once to create the first admin user:
 *   node backend/scripts/seedAdmin.js
 *
 * Override defaults via env vars:
 *   ADMIN_NAME="vasudev kumar" ADMIN_EMAIL="admin@example.com" ADMIN_PASS="secret123" node backend/scripts/seedAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_NAME  = process.env.ADMIN_NAME  || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vasudevshanu07@gmail.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'DersaiyA@1';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    } else {
      existing.role = 'admin';
      await existing.save({ validateBeforeSave: false });
      console.log(`Promoted existing user to admin: ${ADMIN_EMAIL}`);
    }
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    role: 'admin',
    isEmailVerified: true,
  });

  console.log(`Admin created successfully`);
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASS}`);
  console.log('Change the password after first login.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
