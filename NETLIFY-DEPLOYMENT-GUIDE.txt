# BDTechZen Footwear Storefront — Full-Stack (GitHub + Netlify Serverless + MySQL)

Complete full-stack React + Express + Netlify Serverless Functions + MySQL e-commerce platform for **BDTechZen**.

## Quick Deploy: GitHub -> Netlify

1. **Unzip** `bdtechzen-netlify-fullstack.zip` on your computer.
2. Create a new repository on [GitHub](https://github.com/new) and push the **contents** of this folder so `package.json` and `netlify.toml` are in the **root** of the repository.
3. Log in to [Netlify](https://app.netlify.com) -> **Add new site** -> **Import an existing project** -> **GitHub** -> select your repository.
4. Netlify automatically detects `netlify.toml`:
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
   - **Node version:** `22`
5. **(Recommended for Permanent Cloud Database, Email & SMS)** Open **Site configuration -> Environment variables** in Netlify and add:
   - `JWT_SECRET` = any strong secret text (e.g. `bdtechzen_live_secret_2026`)
   - `MYSQL_URL` = `mysql://user:password@host:4000/bdtechzen_store?ssl={"rejectUnauthorized":false}` *(Free 5GB Cloud MySQL from TiDB Cloud Serverless or Aiven — tables & all 12 products auto-create on first request!)*
   - `SMTP_HOST`, `SMTP_PORT` (`465` or `587`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` *(e.g. Gmail App Password for `khalil5172@gmail.com`)*
   - `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` *(Optional BulkSMSBD / GreenWeb API key)*
6. Click **Deploy site**!

- **Public Storefront:** `https://<your-site>.netlify.app`
- **API Health Check:** `https://<your-site>.netlify.app/api/health`
- **Admin Dashboard:** `https://<your-site>.netlify.app/admin` (`krrahman` / `kr123456`)
