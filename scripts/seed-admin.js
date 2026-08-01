/**
 * Create an admin user in PostgreSQL.
 * Usage (after DATABASE_URL is set and prisma db push):
 *   node scripts/seed-admin.js admin@example.com YourStrongPassword
 *
 * Default credentials (if no arguments provided):
 *   Email: lajwantiharani7@gmail.com
 *   Password: lajwanti@123
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function main() {
  const email = process.argv[2] || "lajwantiharani7@gmail.com";
  const password = process.argv[3] || "lajwanti@123";
  const name = process.argv[4] || "Admin";

  if (!process.argv[2]) {
    console.log("Using default admin credentials...");
  }

  if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists with any role
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Force update to admin role regardless of previous role
    console.log(`User found with role: ${existingUser.role}. Converting to admin...`);
    const user = await prisma.user.update({
      where: { email },
      data: {
        role: "admin",
        password: hashedPassword,
        name: name || existingUser.name || "Admin",
        isVerified: true,
        profileVerificationStatus: "approved",
      },
    });
    console.log("✅ Admin user ready:", user.email, user.id, "(converted from", existingUser.role, "to admin)");
  } else {
    // Create new admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "admin",
        name,
        isVerified: true,
        profileVerificationStatus: "approved",
      },
    });
    console.log("✅ Admin user created:", user.email, user.id);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
