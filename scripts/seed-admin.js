/**
 * Create an admin user in PostgreSQL.
 * Usage (after DATABASE_URL is set and prisma db push):
 *   node scripts/seed-admin.js admin@example.com YourStrongPassword
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error("Usage: node scripts/seed-admin.js <email> <password> [name]");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "admin",
      password: hashedPassword,
      name,
      isVerified: true,
      profileVerificationStatus: "approved",
    },
    create: {
      email,
      password: hashedPassword,
      role: "admin",
      name,
      isVerified: true,
      profileVerificationStatus: "approved",
    },
  });

  console.log("Admin ready:", user.email, user.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
