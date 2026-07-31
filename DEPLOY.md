# DMYF PostgreSQL Setup

## What I changed in the project

1. The backend uses Prisma with PostgreSQL in `prisma/schema.prisma`.
2. The shared Prisma client is in `config/prisma.js`.
3. The app starts without any MongoDB connection.
4. Request sanitizing is handled by `middlewares/sanitizeRequest.js`.
5. Scripts now include `npm run db:setup` for PostgreSQL table setup.

## What you need to do locally

1. Create a PostgreSQL database. Free options:
   - Neon: https://neon.tech
   - Supabase: https://supabase.com
2. Put your PostgreSQL connection string in `.env`:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
   ```
3. Keep these `.env` values filled:
   ```env
   JWT_SECRET=change-this-to-a-long-random-secret
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password
   CLIENT_URL=http://localhost:3000
   ```
4. Install dependencies and create PostgreSQL tables:
   ```bash
   npm install
   npm run db:setup
   ```
5. If you have old MongoDB data to copy one time, add `MONGO_URL` temporarily and run:
   ```bash
   npm run migrate:from-mongo
   ```
6. Create admin user if none exists:
   ```bash
   npm run seed:admin -- admin@email.com YourPassword123 Admin
   ```
7. Start the project:
   ```bash
   npm run dev
   ```

## Deploy

Use these settings on Render/Railway/Replit:

- Build: `npm install && npx prisma generate && npm run build`
- Start: `npm start`
- Environment: `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `NODE_ENV=production`, `CLIENT_URL`, `REACT_APP_BASEURL=/api/v1`

After old data is copied successfully, remove `MONGO_URL` from `.env`.
