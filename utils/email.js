const nodemailer = require("nodemailer");

// Log environment variables for debugging
console.log("Email ID:", process.env.EMAIL_ID);
console.log("Email Password:", process.env.EMAIL_PASSWORD ? "Set" : "Not set");

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD.replace(/\s/g, ""), // Remove spaces from App Password
  },
});

// Function to send an email
const sendResetEmail = async (toEmail, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_ID,
      to: toEmail,
      subject: "OTP Verification",
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email:", error.message);
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    throw new Error("Failed to send email: " + error.message);
  }
};

module.exports = { sendResetEmail };
