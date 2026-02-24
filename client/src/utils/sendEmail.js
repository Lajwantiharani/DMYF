const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create transporter for Gmail with proper settings
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email content
  const mailOptions = {
    from: `"${process.env.APP_NAME || "DMYVF"}" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log("📧 Attempting to send email to:", options.to);
    console.log("📧 From:", process.env.EMAIL_USER);
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", options.to);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error.message);
    console.error("📝 Make sure EMAIL_USER and EMAIL_PASS are set in .env");
    console.error("📝 EMAIL_PASS should be a Gmail App Password");
    return false;
  }
};

module.exports = sendEmail;
