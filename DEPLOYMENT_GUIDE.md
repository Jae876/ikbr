# 🚀 Complete Vercel Deployment Guide

Everything you need to deploy the Interactive Brokers Replica to Vercel with full user registration and authentication.

## What's Been Set Up

✅ **Vercel Serverless Functions**
- `/api/auth/signup` - Register new users
- `/api/auth/login` - User login with JWT
- `/api/auth/verify` - Token verification

✅ **Database Layer**
- PostgreSQL schema with users, accounts, positions, transactions
- Connection pooling with pg
- Password hashing with bcryptjs
- JWT token generation and validation

✅ **Frontend Integration**
- Signup form with validation
- Login form with demo account fallback
- API client with token management
- Protected routes ready

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/interactive-brokers-replica.git
git push -u origin main
```

### Step 3: Deploy to Vercel

**Option A: GitHub Integration (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect your setup
5. Click "Deploy"

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

### Step 4: Set Up Database

In your Vercel Project Settings:

1. **Add PostgreSQL Database**
   - Option A: Use Vercel Postgres (integrated)
     - Click "Storage" → "Create Database" → "PostgreSQL"
   - Option B: Use External Database
     - Get connection URL from your provider (Supabase, RDS, etc.)

2. **Environment Variables**
   - Vercel will auto-add `DATABASE_URL` if using Vercel Postgres
   - Add `JWT_SECRET`: Use this command to generate one:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

### Step 5: Initialize Database Schema

After first deployment, initialize tables:

**Method A: Using psql (if you have local PostgreSQL)**
```bash
psql $DATABASE_URL < scripts/init-schema.sql
```

**Method B: Using curl on deployed function**
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/init \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-deployment-secret"}'
```

**Method C: Using your database client directly**
See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for full SQL schema

### Step 6: Update Frontend Config

Create `.env.production`:
```
VITE_API_URL=https://your-vercel-domain.vercel.app/api
```

For development, use `.env.local`:
```
VITE_API_URL=http://localhost:3000/api
```

### Step 7: Test It!

1. **Visit your Vercel domain**
2. **Click "Sign Up"** to create a new account
3. **Login with your new credentials**

## API Endpoints Reference

### Signup
```bash
POST /api/auth/signup

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "accountType": "individual"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "account": {...}
  }
}
```

### Login
```bash
POST /api/auth/login

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: Same as signup
```

### Verify Token
```bash
GET /api/auth/verify
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "valid": true,
  "user": {...}
}
```

## Project Structure

```
ikbr/
├── api/                          # Vercel serverless functions
│   ├── auth/
│   │   ├── signup.ts            # User registration endpoint
│   │   ├── login.ts             # User login endpoint
│   │   └── verify.ts            # Token verification endpoint
│   └── lib/
│       ├── db.ts                # Database connection & schema
│       └── auth.ts              # JWT & password utilities
├── src/
│   ├── pages/
│   │   ├── SignupPage.tsx       # Registration form
│   │   └── LoginPage.tsx        # Login form
│   └── services/
│       └── apiClient.ts         # API client with auth
├── .env.example                 # Environment template
├── vercel.json                  # Vercel configuration
└── VERCEL_SETUP.md             # Detailed setup guide
```

## Features

✨ **User Accounts**
- Email & password signup
- Secure password hashing
- JWT authentication (30-day tokens)
- Email uniqueness validation

✨ **Account Management**
- Auto-initialized with $50,000 starting balance
- Linked to user profile
- Transaction history tracking
- Position management

✨ **Security**
- Bcryptjs password hashing
- JWT token validation
- CORS enabled
- SQL injection protection (parameterized queries)

✨ **Demo Account Still Works**
- Email: `demo@example.com`
- Password: `Demo123!@`
- Useful for testing without signup

## Troubleshooting

### "Cannot find module '@vercel/node'"
```bash
npm install -D @vercel/node
npm install -D @types/node
```

### "DATABASE_URL is undefined"
1. Check Vercel project settings
2. Verify environment variable is set
3. Redeploy after adding env var:
   ```bash
   vercel env pull
   vercel redeploy
   ```

### "CORS errors in browser"
- All endpoints have CORS enabled globally
- Check browser console for exact error
- Verify `VITE_API_URL` matches deployed domain

### "Token verification failed"
- Ensure `JWT_SECRET` hasn't changed between deployments
- Check token hasn't expired (30 days)
- Verify Authorization header format: `Bearer TOKEN`

### "Email already exists"
- User already registered with that email
- Use different email or reset database

### "Password doesn't meet requirements"
Requirements:
- ✓ At least 8 characters
- ✓ At least one uppercase letter
- ✓ At least one lowercase letter
- ✓ At least one number
- ✓ At least one special character (!@#$%^&*)

Example: `SecurePass123!`

## Performance & Monitoring

- **Database**: Vercel Postgres (auto-scaling)
- **API**: Vercel Serverless Functions (cold start ~100-500ms)
- **Frontend**: Static assets cached globally via CDN
- **Monitoring**: Check Vercel dashboard for function logs

## Production Checklist

- [ ] Database backup enabled
- [ ] JWT_SECRET is strong & saved separately
- [ ] HTTPS enforced (Vercel default)
- [ ] Error tracking enabled (optional: Sentry)
- [ ] Monitor function execution time
- [ ] Set up domain custom domain
- [ ] Configure email notifications
- [ ] Document API usage
- [ ] Test signup/login flow end-to-end
- [ ] Review Vercel logs for errors

## Next Steps

### Optional: Add More Features

1. **Password Reset**
   - Create `/api/auth/reset-password`
   - Send reset link via email

2. **Social Login**
   - Google OAuth
   - GitHub OAuth

3. **Profile Management**
   - Update user info
   - Change password

4. **Trading Features**
   - Place trades via API
   - Real-time position updates

5. **Email Notifications**
   - Welcome email
   - Login alerts
   - Transaction confirmations

### Customize for Production

1. Add branding/logo
2. Configure email service (SendGrid, Mailgun)
3. Set up analytics (Vercel Analytics)
4. Add monitoring (Sentry, LogRocket)
5. Create privacy/terms pages

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **JWT Docs**: https://jwt.io
- **GitHub Issues**: Check project repository

## Environment Variables Checklist

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random string (32+ chars)

Optional:
- `NODE_ENV` - Set to "production"
- `VITE_API_URL` - For frontend (set in frontend .env)

## Security Notes

🔒 **Password Security**
- Never store passwords in plain text
- Always hash with bcryptjs
- Use strong random salt (10+ rounds)

🔒 **JWT Tokens**
- Set strong JWT_SECRET (32+ random characters)
- Use HTTPS only (Vercel enforces this)
- Implement token refresh (consider for future)

🔒 **Database**
- Use parameterized queries (prevents SQL injection)
- IP whitelist for database access (if available)
- Regular backups enabled

🔒 **CORS**
- Enable only trusted origins in production
- Consider domain-specific CORS rules

## Deployment Health Check

After deployment, verify:

1. **Homepage loads** - https://your-vercel-domain.vercel.app
2. **Signup works** - Create test account
3. **Login works** - Login with new account
4. **JWT persists** - Check localStorage for token
5. **API calls work** - View network tab in DevTools
6. **Logout works** - Token should be cleared

---

**Status**: ✅ Ready for Production

All backend infrastructure is production-ready. Deploy now and start accepting users!
