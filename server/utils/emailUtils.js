import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // If SMTP is not configured, just log it for development
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('--- EMAIL MOCK ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('------------------');
      return { success: true, message: 'Email logged (mock mode)' };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Harmoniq" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotification = async (teacherData) => {
  const subject = 'New Teacher Signup Request';
  const text = `A new teacher has signed up and is waiting for approval.\n\nName: ${teacherData.name}\nEmail: ${teacherData.email}\nInstrument: ${teacherData.instrumentExpertise}\nExperience: ${teacherData.yearsOfExperience} years`;
  const html = `
    <h2>New Teacher Signup Request</h2>
    <p>A new teacher has signed up and is waiting for approval.</p>
    <ul>
      <li><strong>Name:</strong> ${teacherData.name}</li>
      <li><strong>Email:</strong> ${teacherData.email}</li>
      <li><strong>Instrument:</strong> ${teacherData.instrumentExpertise}</li>
      <li><strong>Experience:</strong> ${teacherData.yearsOfExperience} years</li>
    </ul>
    <p>Please log in to the admin dashboard to review this request.</p>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    text,
    html,
  });
};

export const sendTeacherApprovalEmail = async (teacherEmail, teacherName, officialEmail, defaultPassword) => {
  const subject = 'Your Harmoniq Teacher Account has been Approved!';
  const text = `Hello ${teacherName},\n\nCongratulations! Your application to become a teacher on Harmoniq has been approved. You can now log in and start managing your classes.\n\nYour official login credentials:\nEmail: ${officialEmail}\nPassword: ${defaultPassword}\n\nBest regards,\nHarmoniq Team`;
  const html = `
    <h2>Account Approved!</h2>
    <p>Hello ${teacherName},</p>
    <p>Congratulations! Your application to become a teacher on Harmoniq has been approved. You can now log in and start managing your classes.</p>
    <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Your Official Login Credentials:</strong></p>
      <p style="margin: 0 0 5px 0;">Email: <strong>${officialEmail}</strong></p>
      <p style="margin: 0;">Password: <strong>${defaultPassword}</strong></p>
    </div>
    <p>Best regards,<br>Harmoniq Team</p>
  `;

  return sendEmail({
    to: teacherEmail,
    subject,
    text,
    html,
  });
};

export const sendTeacherRejectionEmail = async (teacherEmail, teacherName) => {
  const subject = 'Update on your Harmoniq Teacher Application';
  const text = `Hello ${teacherName},\n\nThank you for your interest in joining Harmoniq. After reviewing your profile, we are unable to approve your teacher account at this time.\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\nHarmoniq Team`;
  const html = `
    <h2>Application Status Update</h2>
    <p>Hello ${teacherName},</p>
    <p>Thank you for your interest in joining Harmoniq. After reviewing your profile, we are unable to approve your teacher account at this time.</p>
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>Harmoniq Team</p>
  `;

  return sendEmail({
    to: teacherEmail,
    subject,
    text,
    html,
  });
};
