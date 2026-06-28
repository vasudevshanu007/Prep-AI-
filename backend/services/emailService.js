const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"PrepAI" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  return await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">PrepAI</h1>
        <p style="color: rgba(255,255,255,0.8);">AI Powered Interview Preparation</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for signing up. Please verify your email address to get started.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Verify your PrepAI account', html });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">PrepAI</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2>Reset Password</h2>
        <p>Hi ${name}, you requested a password reset.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Reset your PrepAI password', html });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
