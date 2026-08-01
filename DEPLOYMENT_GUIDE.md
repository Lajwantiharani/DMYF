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
4. Run: `node scripts/seed-admin.js` (uses default credentials)
   - **Default Admin Email**: lajwantiharani7@gmail.com
   - **Default Admin Password**: lajwanti@123
   - Or run with custom credentials: `node scripts/seed-admin.js your@email.com YourPassword Admin`

### Step 5: Access Your Application

Your app will be live at: `https://dmyf-bloodbank.onrender.com`

**Default Admin Login:**
- Email: lajwantiharani7@gmail.com
- Password: lajwanti@123

**Email Configuration:**
All verification and request emails are sent to the admin email (lajwantiharani7@gmail.com):
- Profile verification requests from donors/receivers/organizations
- Blood request notifications
- Availability request notifications
- Verification approval/rejection notifications

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

---

## Other Free Hosting Options

### Option 4: Fly.io (Free Tier Available)

**Features:**
- 3 shared VMs with 256MB RAM each
- 160GB outbound bandwidth
- Free PostgreSQL database (3GB)

**Deployment Steps:**
1. Install Fly CLI: `npm install -g @flyctl/fly`
2. Run: `fly launch` in the DMYF directory
3. Follow the prompts to configure
4. Deploy: `fly deploy`

**Note:** Requires credit card for verification (but free tier doesn't charge)

---

### Option 5: Cyclic.sh (100% Free)

**Features:**
- Completely free Node.js hosting
- No credit card required
- Automatic deployments from GitHub
- Built-in PostgreSQL database

**Deployment Steps:**
1. Go to https://cyclic.sh
2. Sign up with GitHub
3. Import your repository
4. Set root directory to `DMYF`
5. Add environment variables
6. Deploy automatically

**Limitations:**
- Apps sleep after 30 minutes of inactivity
- 1GB bandwidth per month

---

### Option 6: Glitch.com (Free Tier)

**Features:**
- Free Node.js hosting
- Built-in code editor
- Auto-deploy from GitHub
- 4000 hours/month runtime

**Deployment Steps:**
1. Go to https://glitch.com
2. Create new project
3. Import from GitHub
4. Set up environment variables
5. Your app gets a free `.glitch.me` domain

**Limitations:**
- Projects sleep after 5 minutes of inactivity
- 512MB storage
- 512MB RAM

---

### Option 7: Replit (Free Tier)

**Features:**
- Free Node.js hosting
- Built-in IDE
- Always-on with UptimeRobot
- PostgreSQL database available

**Deployment Steps:**
1. Go to https://replit.com
2. Create new repl
3. Import from GitHub
4. Configure environment variables
5. Click "Run" to deploy

**Limitations:**
- Projects sleep after inactivity (use UptimeRobot to keep awake)
- 500MB storage on free tier

---

### Option 8: Netlify + Railway (Frontend + Backend)

**Frontend on Netlify:**
1. Go to https://netlify.com
2. Drag & drop the `DMYF/client/build` folder
3. Or connect GitHub repo with root directory `DMYF/client`
4. Add environment variable: `REACT_APP_BASEURL=https://your-backend.railway.app/api/v1`

**Backend on Railway:**
- Follow Option 2 backend steps

**Benefits:**
- Netlify has generous free tier
- Automatic HTTPS
- CDN for frontend assets

---

### Option 9: Vercel + Supabase (Modern Stack)

**Frontend on Vercel:**
1. Go to https://vercel.com
2. Import GitHub repo
3. Root directory: `DMYF/client`
4. Add environment variable: `REACT_APP_BASEURL=https://your-backend.vercel.app/api/v1`

**Backend on Vercel (Serverless Functions):**
- Convert Express app to Vercel serverless functions
- More complex setup but fully free

**Database on Supabase:**
1. Go to https://supabase.com
2. Create free PostgreSQL database
3. Get connection string
4. Use instead of Neon.tech

**Benefits:**
- All free tiers
- Modern stack
- Great performance

---

## Comparison Table

| Platform | Free Tier | Database | Ease of Use | Best For |
|----------|-----------|----------|--------------|----------|
| **Render** | ✅ Free | External (Neon) | ⭐⭐⭐⭐⭐ | Full-stack apps |
| **Railway** | $5 credit/month | Built-in PostgreSQL | ⭐⭐⭐⭐ | Backend APIs |
| **Fly.io** | ✅ Free tier | Built-in PostgreSQL | ⭐⭐⭐ | Global deployment |
| **Cyclic** | ✅ 100% Free | Built-in PostgreSQL | ⭐⭐⭐⭐⭐ | Quick deployment |
| **Glitch** | ✅ Free | External only | ⭐⭐⭐⭐ | Prototyping |
| **Replit** | ✅ Free | External only | ⭐⭐⭐ | Learning/Testing |
| **Netlify** | ✅ Free | External only | ⭐⭐⭐⭐⭐ | Frontend hosting |
| **Vercel** | ✅ Free | External only | ⭐⭐⭐⭐⭐ | Frontend/Next.js |

---

## My Recommendation

**For your DMYF Blood Bank project:**

1. **Easiest**: Use **Render.com** (already configured)
2. **Best Free Database**: Use **Neon.tech** (3GB free, no time limit)
3. **Alternative**: Use **Cyclic.sh** (completely free, no credit card needed)
4. **Production Ready**: Use **Railway.app** ($5/month free credit)

**Quick Summary:**
- Render.com = Easiest (already set up)
- Cyclic.sh = Completely free, no credit card
- Railway.app = Best for production with built-in database
- Fly.io = Good for global deployment

Choose based on your needs:
- **Just want it live fast?** → Render.com
- **No credit card?** → Cyclic.sh
- **Need more resources?** → Railway.app
- **Want global CDN?** → Fly.io

All options will work great for your blood bank management system!
