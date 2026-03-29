# Vercel Backend Setup Guide

This guide explains how to set up the backend for the Interactive Brokers replica on Vercel with database integration.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database** - Options:
   - Vercel Postgres (Recommended - integrated directly in Vercel)
   - Supabase PostgreSQL
   - AWS RDS PostgreSQL
   - Any managed PostgreSQL provider
3. **GitHub Account** - For connecting your repository to Vercel

## Step 1: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Click on "Storage" tab
3. Create a new "Postgres" database
4. Copy the `DATABASE_URL` connection string
5. Vercel will automatically add it to your environment variables

### Option B: External PostgreSQL (Supabase, RDS, etc.)

1. Create a PostgreSQL database with your provider
2. Get the connection URL (usually in format: `postgresql://user:password@host:port/database`)
3. Add it to Vercel environment variables

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option B: Using GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect your project settings

## Step 3: Configure Environment Variables

In your Vercel project settings:

1. Go to Settings → Environment Variables
2. Add the following variables:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-key-generate-one
NODE_ENV=production
```

**Generate a secure JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Initialize Database

After first deployment, initialize the database schema:

### Option A: Using cURL

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-deployment-secret"}'
```

### Option B: Using a database client

Connect directly to your PostgreSQL database and run:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'individual',
  created_at_account TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 0,
  buying_power DECIMAL(15, 2) DEFAULT 0,
  margin_level DECIMAL(5, 2) DEFAULT 2.0,
  total_deposits DECIMAL(15, 2) DEFAULT 0,
  unrealized_gains DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  avg_cost DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  unrealized_pl DECIMAL(15, 2),
  unrealized_pl_percent DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(255),
  balance DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 5: Update Frontend Environment

Update `.env` or `.env.local` in your frontend:

```
VITE_API_URL=https://your-vercel-domain.vercel.app/api
```

For local development, use:
```
VITE_API_URL=http://localhost:3000/api
```

## Step 6: Test the Setup

### Sign Up (Create Account)

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "accountType": "individual"
  }'
```

### Login

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Verify Token

```bash
curl -X GET https://your-vercel-domain.vercel.app/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` environment variable is set correctly
- Verify database is accessible from Vercel IPs
- Check credentials are correct

### "Module not found: @vercel/node"
```bash
npm install -D @vercel/node
```

### "CORS errors"
- All API endpoints have CORS enabled
- Check `Access-Control-Allow-Origin` headers in responses

### "JWT signature invalid"
- Verify `JWT_SECRET` matches between deployments
- For existing tokens, they may be invalid if secret changed

## Production Checklist

- [ ] `JWT_SECRET` is strong and unique
- [ ] `DATABASE_URL` is set in environment
- [ ] Database tables are initialized
- [ ] Frontend `VITE_API_URL` points to correct domain
- [ ] HTTPS is enforced
- [ ] Regular database backups enabled
- [ ] Monitor Vercel deployment logs
- [ ] Test signup/login flow end-to-end

## API Endpoints

All endpoints are prefixed with `/api/`:

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/verify` - Verify JWT token
- `GET /auth/verify?expired=1` - Check if token is expired

## Need Help?

- Vercel Docs: https://vercel.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Check Vercel deployment logs for errors
