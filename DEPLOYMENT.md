# SnapLink Deployment Guide

This guide describes how to deploy the SnapLink full-stack application to production. 

- **Frontend**: Deployed on **Vercel** (Static SPA hosting with routing rules).
- **Backend Service**: Deployed on **Render** (Express Node.js web service).
- **Database**: Hosted on **MongoDB Atlas** (Cloud Database).

---

## Phase 1: Database Setup (MongoDB Atlas)

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Database Cluster (Shared free tier is sufficient).
3. Under **Security -> Database Access**, create a database user with read/write privileges (note the username and password).
4. Under **Security -> Network Access**, click **Add IP Address** and choose `0.0.0.0/0` (Allow access from anywhere, required for Render's dynamic IP addresses).
5. Navigate to **Database -> Cluster -> Connect** and select **Drivers**. Copy the connection string (looks like `mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/?retryWrites=true&w=majority`).
6. Replace `<username>` and `<password>` in the connection string with your database credentials.

---

## Phase 2: Backend Deployment (Render)

1. Sign in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the SnapLink monorepo.
4. Configure the service settings:
   - **Name**: `snaplink-backend`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Click **Advanced** to add environment variables:
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `JWT_SECRET`: *A secure random string (e.g. `d3b07384d113edec49eaa6238ad...`)*
   - `PORT`: `10000` (Render binds automatically, but setting it explicitly is a best practice)
   - `BASE_URL`: *The URL Render gives you after creation (e.g., `https://snaplink-backend.onrender.com`)*
6. Click **Create Web Service**. The deployment logs will show the connection to MongoDB and port binding.

---

## Phase 3: Frontend Deployment (Vercel)

1. Log into [Vercel](https://vercel.com).
2. Click **Add New** and choose **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Name**: `snaplink`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
5. Expand **Build and Development Settings**:
   - Ensure the build command is `npm run build`.
   - Ensure output directory is `dist`.
6. Set Environment Variables:
   - Since Vite proxies requests locally, in production we need to configure Vite's build settings or API endpoints to target our Render backend.
   - We must update the API calls to use the full Render URL. We have designed the frontend to make requests to `/api/url/...` and `/api/auth/...`.
   - To handle proxying on Vercel, we can add a `vercel.json` file in the root of the `client` directory to rewrite all `/api` and redirections to the Render service URL!

---

### Step 4: Configure Vercel URL Rewrites (`vercel.json`)

To make sure that all API calls (`/api/...`) and short link redirects (e.g. `/xyzabc`) match the production backend, place a `vercel.json` in the root of `client/` folder:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://snaplink-backend.onrender.com/api/:path*"
    },
    {
      "source": "/:shortCode([a-zA-Z0-9]{6})",
      "destination": "https://snaplink-backend.onrender.com/:shortCode"
    },
    {
      "source": "/((?!assets/|favicon.ico|index.html|analytics/).*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite rule ensures:
1. All client-side calls starting with `/api` are proxied to Render.
2. Short codes (exactly 6 alphanumeric characters) are forwarded directly to the Render redirection engine.
3. Standard SPA routes (like `/login`, `/register`, or `/analytics/xyzabc`) are handled client-side by Vercel static router (`index.html`).
