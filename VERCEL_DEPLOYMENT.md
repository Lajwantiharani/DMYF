# Vercel Deployment Guide for DMYF Blood Bank

## Overview

Since Vercel is designed for frontend frameworks and serverless functions, you have two options:

**Option A: Full-stack on Vercel** (Frontend + Backend as Serverless Functions)
**Option B: Hybrid** (Frontend on Vercel + Backend on Railway/Render)

---

## Option A: Full-stack on Vercel (Recommended)

This option deploys both your React frontend and Express backend on Vercel using Serverless Functions.

### Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. GitHub account
3. Neon.tech PostgreSQL database (https://neon.tech)
4. Your code pushed to GitHub

### Step 1: Prepare Your Project Structure

Create a new folder `api` in the `DMYF` directory to host your Express app as Vercel Serverless Functions.

**File structure:**
```
DMYF/
├── api/
│   └── index.js (your server.js adapted for Vercel)
├── client/
├── package.json
└── vercel.json
```

### Step 2: Create Vercel Serverless Function

Create `DMYF/api/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import your existing server code
const sanitizeRequest = require('../middlewares/sanitizeRequest');
const securityHeaders = require('../middlewares/securityHeaders');
const apiLogger = require('../middlewares/apiLogger');

const app = express();

// Middleware
app.use(express.json({ limit: "100kb" }));
app.use(helmet());
app.use(sanitizeRequest());
app.use(securityHeaders());
app.use(apiLogger);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://*.vercel.app",
  "https://*.vercel.sh",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));

// Your existing routes
app.use("/api/v1/test", require("../routes/testRoutes"));
app.use("/api/v1/auth", require("../routes/authRoutes"));
app.use("/api/v1/inventory", require("../routes/inventoryRoutes"));
app.use("/api/v1/analytics", require("../routes/analyticsRoutes"));
app.use("/api/v1/admin", require("../routes/adminRoutes"));
app.use("/api/v1/receiver", require("../routes/receiverRoutes"));
app.use("/api/v1/inquiries", require("../routes/inquiryRoutes"));

// 404 handler
app.use("/api", (req, res) => {
  return res.status(404).send({ success: false, message: "API route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).send({ success: false, message: "CORS blocked" });
  }
  console.error("[ERROR]", req.method, req.originalUrl, err.message);
  return res.status(500).send({ success: false, message: "Server error" });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`.bgBlue.white);
  });
}
```

### Step 3: Create vercel.json Configuration

Create `DMYF/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DEV_MODE": "production"
  }
}
```

### Step 4: Update Root package.json

Update `DMYF/package.json` to add Vercel-specific scripts:

```json
{
  "scripts": {
    "dev": "npm run server",
    "server": "nodemon server.js",
    "client": "npm start --prefix ./client",
    "build": "npm run build --prefix ./client",
    "start": "node server.js",
    "vercel-build": "npm install && npx prisma generate && npm run build"
  }
}
```

### Step 5: Update Client for Vercel

Update `DMYF/client/package.json` to add homepage:

```json
{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "homepage": ".",
  ...
}
```

### Step 6: Deploy to Vercel

**Method 1: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to DMYF directory
cd DMYF

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? dmyf-bloodbank
# - In which directory is your code? ./
# - Override settings? No
```

**Method 2: Using Vercel Dashboard (Easier)**

1. Go to https://vercel.com and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `DMYF`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   DEV_MODE=production
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   JWT_SECRET=DMYF-BloodBank-Secure-Secret-2024-Production-Key
   APP_NAME=DMYF
   EMAIL_USER=lajwantiharani7@gmail.com
   EMAIL_PASS=llpjfsqhxvjrokab
   CLIENT_URL=https://your-project.vercel.app
   REACT_APP_BASEURL=/api/v1
   ```

6. Click "Deploy"
7. Wait 2-3 minutes for deployment

### Step 7: Initialize Database

After deployment, you need to set up your database:

**Option A: Using Vercel CLI**
```bash
vercel env pull .env.local
npx prisma db push
node scripts/seed-admin.js
```

**Option B: Using Neon.tech Console**
1. Go to https://neon.tech
2. Open your project
3. Use the SQL editor to run migrations manually
4. Or connect locally and run: `npx prisma db push`

### Step 8: Access Your Application

Your app will be live at: `https://your-project.vercel.app`

**Default Admin Login:**
- Email: lajwantiharani7@gmail.com
- Password: lajwanti@123

---

## Option B: Hybrid (Frontend on Vercel + Backend on Railway)

This is often easier and more reliable for full-stack apps.

### Step 1: Deploy Backend on Railway

1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL plugin
4. Deploy from GitHub with root directory `DMYF`
5. Add environment variables
6. Your backend will be at: `https://your-backend.railway.app`

### Step 2: Deploy Frontend on Vercel

1. Go to https://vercel.com
2. Import your GitHub repo
3. Root directory: `DMYF/client`
4. Add environment variable:
   ```
   REACT_APP_BASEURL=https://your-backend.railway.app/api/v1
   ```
5. Deploy

### Step 3: Update CORS

Update `DMYF/server.js` to allow your Vercel domain:

```javascript
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  "https://your-project.vercel.app",
  "https://*.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean));
```

---

## Important Vercel Considerations

### 1. Serverless Function Limitations

**Cold Starts:**
- First request after inactivity takes 1-2 seconds
- Subsequent requests are fast
- Free tier: No sleep, always warm

**Execution Time:**
- Free tier: 10 second timeout
- Pro tier: 60 second timeout
- Your Express app should work fine

**File System:**
- Read-only except `/tmp` directory
- Prisma client works fine
- File uploads need to use `/tmp` or external storage

### 2. Database Connection

**Use Connection Pooling:**
```javascript
// In your Prisma setup
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Neon.tech Connection String:**
```
postgresql://user:pass@host/db?sslmode=require&pgbouncer=true
```

### 3. Environment Variables

**In Vercel Dashboard:**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add all variables from `.env`
4. Redeploy after adding new variables

**Required Variables:**
```
DATABASE_URL
JWT_SECRET
EMAIL_USER
EMAIL_PASS
APP_NAME
CLIENT_URL
NODE_ENV
REACT_APP_BASEURL
```

### 4. Build Configuration

**vercel.json for Full-stack:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/$1"
    }
  ]
}
```

---

## Troubleshooting Vercel Deployment

### Issue 1: Build Fails

**Error: "prisma generate failed"**

**Solution:**
Add to `vercel.json`:
```json
{
  "build": {
    "env": {
      "DATABASE_URL": "@database_url"
    }
  }
}
```

Or use Vercel Environment Variables.

### Issue 2: API Routes Not Working

**Error: "404 Not Found" on /api/* routes**

**Solution:**
Check `vercel.json` routes configuration. Make sure API routes are defined before static routes.

### Issue 3: CORS Errors

**Error: "CORS blocked"**

**Solution:**
Update CORS configuration in `api/index.js`:
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://*.vercel.app",
  "https://*.vercel.sh",
].filter(Boolean);
```

### Issue 4: Database Connection Issues

**Error: "Too many connections" or "Connection timeout"**

**Solution:**
1. Use Neon.tech with connection pooling
2. Add `?pgbouncer=true` to DATABASE_URL
3. Use serverless-friendly Prisma setup

### Issue 5: Large Bundle Size

**Error: "Function size limit exceeded"**

**Solution:**
1. Optimize dependencies
2. Use dynamic imports
3. Split code with React.lazy()

---

## Vercel vs Render Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Free Tier** | ✅ Yes | ✅ Yes |
| **Cold Starts** | No (always warm) | Yes (sleeps after 15min) |
| **Deployment Speed** | Fast (30s) | Slower (5-10min) |
| **Backend Support** | Serverless Functions | Traditional servers |
| **Database** | External only | External only |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Best For** | Frontend + APIs | Full-stack apps |

---

## Recommended Approach for DMYF

**Best Option: Hybrid (Vercel + Railway)**

**Why?**
1. Vercel is optimized for React frontend
2. Railway handles Express backend better
3. Both have generous free tiers
4. More reliable than serverless for full-stack
5. Easier debugging

**Steps:**
1. Deploy backend on Railway (follow Option 2 in DEPLOYMENT_GUIDE.md)
2. Deploy frontend on Vercel
3. Connect them via REACT_APP_BASEURL

**Alternative: Full-stack on Vercel**

If you want everything on Vercel:
1. Follow Option A steps above
2. Use the `api/index.js` pattern
3. Configure `vercel.json` properly
4. Works great for small to medium apps

---

## Quick Start Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from DMYF directory
cd DMYF
vercel

# Pull environment variables
vercel env pull .env.local

# Run database migrations
npx prisma db push

# Seed admin user
node scripts/seed-admin.js

# Deploy to production
vercel --prod
```

---

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API routes respond (test /api/v1/test)
- [ ] Database connection works
- [ ] User registration works
- [ ] Login works
- [ ] Admin can login with default credentials
- [ ] Emails are sent correctly
- [ ] CORS is configured properly
- [ ] Environment variables are set
- [ ] Custom domain is configured (optional)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Neon.tech Docs: https://neon.tech/docs

For issues specific to your DMYF project, check the main DEPLOYMENT_GUIDE.md file.