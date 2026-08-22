# OmniFlow AI Deployment Instructions

Quick guide to deploy the frontend on **Vercel** and the backend on **Render**.

---

## 🎨 Frontend: Vercel Setup

1. **vercel.json**: A `vercel.json` file is configured in `/frontend` to handle single-page application (SPA) routing redirects.
2. **Deploy Steps**:
   - Go to [Vercel Dashboard](https://vercel.com) -> **New Project**.
   - Set **Root Directory** to `frontend`.
   - Add **Environment Variable**:
     - `VITE_API_BASE_URL` = `https://<your-backend>.onrender.com/api`
   - Click **Deploy**.

---

## 🛠️ Backend: Render Setup

1. **Deploy Steps**:
   - Go to [Render Dashboard](https://dashboard.render.com) -> **New Web Service**.
   - Connect your Repository.
   - Set **Runtime** to `Docker`.
   - Set **Root Directory** to `backend`. (Render will automatically compile using `backend/Dockerfile` using Java 21/Maven).
   - Click **Deploy**.
2. **Environment Variables**:
   Add the following variables in the **Environment** settings panel on Render:
   - `SPRING_DATASOURCE_URL` = `jdbc:mysql://<db-host>:<db-port>/<db-name>`
   - `SPRING_DATASOURCE_USERNAME` = `<username>`
   - `SPRING_DATASOURCE_PASSWORD` = `<password>`
   - `GEMINI_API_KEY` = `<api-key>`
   - `JWT_SECRET` = `<secure-hex-string>`
   - `SPRING_REDIS_HOST` = `<redis-host>`
   - `SPRING_REDIS_PORT` = `<redis-port>`

*Note: For database/redis requirements, you can use managed services like Aiven.io (for MySQL) and Upstash (for Redis).*
