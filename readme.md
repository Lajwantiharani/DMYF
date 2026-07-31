# DMYF Blood Bank

DMYF is a full-stack blood bank web application built with React, Express, Prisma, and PostgreSQL. It supports donor, receiver, organization, and admin workflows including registration, OTP email verification, profile completion, profile approval, blood inventory, receiver requests, analytics, inquiries, and Excel exports.

## Tech Stack

- Frontend: React, Redux Toolkit, React Router, Bootstrap, Axios
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Email: Nodemailer
- Deployment: Render-ready configuration

## Project Structure

```text
client/                 React frontend
config/                 Backend configuration
controllers/            Express route controllers
middlewares/            Auth, admin, security, logging middleware
prisma/                 Prisma schema
routes/                 Express routes
scripts/                Database helper scripts
server.js               Express server entry point
```

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL database, such as Neon or local PostgreSQL
- Gmail app password or another SMTP-compatible email setup

## Environment Setup

Create `.env` using `.env.example` as a guide.

Important values:

```env
PORT=8080
NODE_ENV=development
DEV_MODE=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
JWT_SECRET=change-this-to-a-long-random-secret
APP_NAME=DMYF
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
CLIENT_URL=http://localhost:3000
```

Create `client/.env` using `client/.env.example`:

```env
REACT_APP_BASEURL=http://localhost:8080/api/v1
```

## Install And Run

```bash
npm install
npm run db:setup
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

Backend runs on:

```text
http://localhost:8080
```

## Create Default Admin

After `npm run db:setup`, create or update an admin account:

```bash
npm run seed:admin -- admin@dmyf.com Admin123 Admin
```

Default local admin used during setup:

```text
Email: admin@dmyf.com
Password: Admin123
```

Change this password before using the app publicly.

## User Verification Flow

1. A donor, receiver, or organization registers.
2. The user verifies OTP from email.
3. The user completes all required profile fields.
4. The user submits a profile verification request.
5. Admin opens `/verification-requests` and accepts or rejects the request.

## Useful Scripts

```bash
npm run dev                  # Start backend and frontend together
npm run server               # Start backend only
npm run client               # Start frontend only
npm run db:setup             # Push Prisma schema and generate client
npm run prisma:generate      # Generate Prisma client
npm run prisma:push          # Push schema to database
npm run seed:admin -- <email> <password> [name]
npm run migrate:from-mongo   # Optional one-time MongoDB to PostgreSQL import
```

## Optional MongoDB Migration

The app now runs on PostgreSQL. Use MongoDB only if you need to copy old data one time:

```bash
MONGO_URL=your_old_mongodb_url npm run migrate:from-mongo
```

After migration, remove `MONGO_URL` from `.env`.

## Deployment

For Render or similar hosts:

```text
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

Required environment variables:

```text
DATABASE_URL
JWT_SECRET
EMAIL_USER
EMAIL_PASS
NODE_ENV=production
CLIENT_URL
REACT_APP_BASEURL=/api/v1
```

## GitHub Notes

Do not commit `.env`, `node_modules`, `client/build`, cache folders, or local logs. Commit source code, `package.json`, `package-lock.json`, Prisma schema, README, and safe example environment files.
