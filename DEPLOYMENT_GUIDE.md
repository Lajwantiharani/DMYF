# Free Deployment Guide for DMYF Blood Bank

## Option 1: Render.com (RECOMMENDED - Already Configured)

### Prerequisites
1. GitHub account
2. Render.com account (sign up at https://render.com)
3. Neon.tech account for PostgreSQL (sign up at https://neon.tech)

### Step 1: Prepare Your Database (Neon.tech)

1. Go to https://neon.tech and sign up/login
2. Create a new project called "dmyf-bloodbank"
3. Create a new database
4. Copy the connection string (it looks like: `postgresql://user:pass@host/db?sslmode=require`)
5. Save this connection string - you'll need it later

### Step 2: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/dmyf-bloodbank.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render.com

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the "dmyf-bloodbank" repository
5. Configure the service:
   - **Name**: dmyf-bloodbank
   - **Runtime**: Node
   - **Plan**: Free
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `DMYF`

6. Add Environment Variables:
   ```
   NODE_ENV=production
   DEV_MODE=production
   REACT_APP_BASEURL=/api/v1
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require (from Neon.tech)
   JWT_SECRET=DMYF-BloodBank-Secure-Secret-2024-Production-Key
   APP_NAME=DMYF
   EMAIL_USER=lajwantiharani7@gmail.com
   EMAIL_PASS=llpjfsqhxvjrokab
   CLIENT_URL=https://dmyf-bloodbank.onrender.com
   ```

7. Click "Create Web Service"
8. Wait 5-10 minutes for deployment to complete

### Step 4: Initialize Database

After deployment, you need to run database migrations:

1. In Render dashboard, go to your service
2. Click "Shell" tab
3. Run: `npx prisma db push`
4. Run: `node scripts/seed-admin.js admin@email.com YourPassword123 Admin`

### Step 5: Access Your Application

Your app will be live at: `https://dmyf-bloodbank.onrender.com`

---

## Option 2: Railway.app (Alternative)

### Step 1: Database Setup
1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL plugin
4. Copy the DATABASE_URL from variables

### Step 2: Deploy Backend
1. Create new service from GitHub repo
2. Set root directory to `DMYF`
3. Add environment variables (same as Render)
4. Deploy

### Step 3: Deploy Frontend
1. Create new service for frontend
2. Root directory: `DMYF/client`
3. Build command: `npm install && npm run build`
4. Publish directory: `build`
5. Add environment variable: `REACT_APP_BASEURL=https://your-backend-url.railway.app/api/v1`

---

## Option 3: Vercel + Railway (Frontend + Backend Separate)

### Backend on Railway
- Follow Option 2 backend steps
- Your API will be at: `https://your-backend.railway.app`

### Frontend on Vercel
1. Go to https://vercel.com
2. Import your GitHub repo
3. Root directory: `DMYF/client`
4. Add environment variable:
   ```
   REACT_APP_BASEURL=https://your-backend.railway.app/api/v1
   ```
5. Deploy

---

## Important Notes

1. **Free Tier Limitations**:
   - Render: Free web services sleep after 15 minutes of inactivity
   - Railway: $5 free credit monthly
   - Vercel: Free for personal projects

2. **Database**:
   - Neon.tech free tier: 3GB storage, no time limit
   - Keep your DATABASE_URL safe and don't commit it to git

3. **Email Service**:
   - Gmail app password is already configured
   - For production, consider using SendGrid or Mailgun (both have free tiers)

4. **Custom Domain** (Optional):
   - All platforms support custom domains
   - You can use free domains from Freenom or buy one from Namecheap

5. **Auto-Deploy**:
   - All platforms support auto-deploy on git push
   - Just push to GitHub and your app will update automatically

---

## Troubleshooting

### Build Fails
- Check that all dependencies are in package.json
- Ensure Node version is compatible (use Node 18+)

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check that database allows connections from anywhere (0.0.0.0/0)
- Ensure SSL mode is set to require

### Frontend Can't Connect to Backend
- Check REACT_APP_BASEURL is set correctly
- Verify CORS settings in server.js
- Check CLIENT_URL matches your frontend URL

### App Sleeps on Free Tier
- This is normal for free tiers
- First request after sleep takes 30-60 seconds
- Use uptime monitors like UptimeRobot to keep it awake (not recommended for production)

---

## Recommended: Use Render.com

Since your project already has `render.yaml` configured, Render.com is the easiest option. Just follow the steps above and your blood bank management system will be live in 10 minutes!

For questions or issues, check the DEPLOY.md file in your project.