# 100% Free Deployment Guide: Nano File Exchange

This guide will walk you through deploying your college project completely for free using Aiven (Database), Render (Backend), and Vercel (Frontend).

---

## Step 1: Set up the Database (Aiven)
1. Go to [Aiven](https://aiven.io/mysql) and sign up for a free account.
2. Click **Create Service** and select **MySQL**.
3. Choose the **Free Plan** (it doesn't require a credit card).
4. Once created, click on your service to see the **Connection Information**.
5. Look for the **Service URI** (it will look like `mysql://user:password@host:port/defaultdb`).
6. Copy this URI. We will need it in the next step.
   > **Note:** Aiven's URI starts with `mysql://`. SQLAlchemy requires `mysql+pymysql://`. Change the beginning of your copied URI to `mysql+pymysql://`.
   > Example: `mysql+pymysql://avnadmin:secret@xyz.aivencloud.com:26888/defaultdb`

---

## Step 2: Deploy the Backend API (Render)
1. Commit all your latest code to a GitHub repository.
2. Go to [Render](https://render.com) and sign up with GitHub.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository and select it.
5. Fill out the form:
   - **Name**: `nano-exchange-api` (or anything you like)
   - **Language**: Python 3
   - **Root Directory**: `server`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Instance Type**: Free
6. Scroll down to **Environment Variables** and add the following:
   - `DB_URL`: The modified Aiven URI from Step 1 (`mysql+pymysql://...`)
   - `SECRET_KEY`: Generate a random long string (e.g., `my_super_secret_college_project_key_123`)
   - `FRONTEND_URL`: Leave blank for now, we will update it after deploying the frontend.
7. Click **Create Web Service**. Wait 3-5 minutes for it to build and deploy.
8. Copy your Render URL (e.g., `https://nano-exchange-api.onrender.com`).

---

## Step 3: Deploy the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect that it's a Vite project.
5. Click **Edit** next to "Root Directory" and select `frontend`.
6. Open the **Environment Variables** section and add two variables:
   - `VITE_API_URL`: Your Render URL + `/api` (e.g., `https://nano-exchange-api.onrender.com/api`)
   - `VITE_BACKEND_URL`: Just your Render URL (e.g., `https://nano-exchange-api.onrender.com`)
7. Click **Deploy**.
8. Once deployed, Vercel will give you a public URL (e.g., `https://nano-file-exchange.vercel.app`).

---

## Step 4: Finalize CORS (Render)
1. Go back to your Render Dashboard.
2. Open your Web Service and go to **Environment Variables**.
3. Add or update the `FRONTEND_URL` variable to your new Vercel URL (e.g., `https://nano-file-exchange.vercel.app`).
4. Render will automatically redeploy the backend to apply the new CORS settings.

> [!TIP]
> **Free Tier Sleep Behavior:** Render's free tier goes to sleep after 15 minutes of inactivity. When you are about to present your college project, open the website 1 minute before your turn to "wake up" the server. Once it's awake, it will be perfectly fast for the rest of your presentation!
