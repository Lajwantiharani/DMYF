# Deploy DMYF for free (Render)

This app can run as **one free web service** on [Render](https://render.com): API + React build together.

## 1. MongoDB Atlas (free)

1. Open [MongoDB Atlas](https://cloud.mongodb.com)
2. Network Access → Add IP → allow `0.0.0.0/0` (required for Render)
3. Copy your connection string (`MONGO_URL`)

## 2. Push this repo to GitHub

Push `main` to `https://github.com/Lajwantiharani/DMYF.git`  
Do **not** commit `.env` (already gitignored).

## 3. Create Render Web Service

1. Sign up at [https://render.com](https://render.com) with GitHub
2. **New → Blueprint** (uses `render.yaml`) **or** **New → Web Service**
3. Connect repo `Lajwantiharani/DMYF`
4. Settings (if not using Blueprint):
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance:** Free

## 4. Environment variables on Render

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DEV_MODE` | `production` |
| `MONGO_URL` | your Atlas URI |
| `JWT_SECRET` | long random secret (no spaces) |
| `APP_NAME` | `DMYF` |
| `EMAIL_USER` | your Gmail |
| `EMAIL_PASS` | Gmail App Password |
| `CLIENT_URL` | `https://YOUR-SERVICE.onrender.com` |
| `REACT_APP_BASEURL` | `/api/v1` (build-time; also set in `client/.env.production`) |

After the first deploy, set `CLIENT_URL` to the exact Render URL, then **Manual Deploy → Clear build cache & deploy**.

## 5. Open the site

Visit `https://YOUR-SERVICE.onrender.com`

**Note:** Free tier sleeps after idle; first load can take ~30–60 seconds.
