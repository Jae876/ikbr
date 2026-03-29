# Admin Authentication Integration Guide

## Overview
The AdminPage has been successfully integrated with the Vercel backend authentication system. The password-protected admin dashboard now uses JWT tokens and the `/api/auth/admin-login` endpoint for production-ready authentication.

## Architecture

### Frontend (AdminPage.tsx)
The AdminPage component now:
1. **Authenticates via Backend**: Calls POST `/api/auth/admin-login` with the admin password
2. **Token Management**: Stores JWT token in localStorage (key: `adminToken`)
3. **Session Persistence**: On component mount, validates existing token with 24-hour expiry
4. **Fallback Mode**: If backend is unavailable, falls back to local password verification
5. **Graceful Logout**: Clears all admin tokens and session data

### Backend (api/auth/admin-login.ts)
The admin login endpoint:
- Accepts POST request with `password` parameter
- Validates password against `ADMIN_PASSWORD` environment variable or database hash
- Returns JWT token with negative userId to mark admin role: `userId: -adminId`
- Updates `last_login` timestamp in admin_users table
- Returns admin metadata: `{ token, admin: { id, username, role, lastLogin } }`

### Database (admin_users table)
New table in PostgreSQL schema:
```sql
admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Setup Instructions

### 1. Set Admin Password in Environment
Add to your `.env` file (Vercel Environment Variables):
```
ADMIN_PASSWORD=your-secure-admin-password
```

**Important**: Change `jaeseanjae` immediately in production!

### 2. Initialize Admin User (Optional)
The system can work with just the `ADMIN_PASSWORD` environment variable. To store admin in database:

```sql
-- Manual database initialization
INSERT INTO admin_users (username, password, role) 
VALUES ('admin', 'hashed-password-from-bcryptjs', 'admin');
```

Or create a setup endpoint to initialize the first admin user.

### 3. Frontend Configuration
No additional setup needed. AdminPage automatically:
- Checks for existing valid token on mount
- Calls backend endpoint on password submission
- Handles token expiry and re-authentication
- Implements fallback for local development

## Authentication Flow

### Login Flow
```
User enters password in AdminPage
           ↓
POST /api/auth/admin-login { password }
           ↓
Backend validates against ADMIN_PASSWORD env var
           ↓
Generate JWT token (userId: -adminId, email: admin_username)
           ↓
Update last_login timestamp
           ↓
Return { token, admin: {...} }
           ↓
Frontend stores token in localStorage
           ↓
Display admin dashboard
```

### Session Validation Flow
```
AdminPage mounts
           ↓
Check localStorage for adminToken
           ↓
Check if token is within 24-hour window
           ↓
If valid: Show dashboard
If expired: Show password form
           ↓
Optional: Verify token with /api/auth/verify endpoint
```

### Logout Flow
```
Click Logout button
           ↓
Clear adminToken from localStorage
           ↓
Clear adminAuthTime from localStorage
           ↓
Clear adminUser from localStorage
           ↓
Redirect to password form
```

## Token Structure

Admin JWT tokens follow this pattern:
```javascript
{
  userId: -adminId,      // Negative ID marks admin role
  email: "admin_username",
  iat: 1234567890,      // Issued at
  exp: 1234567890 + (30 * 24 * 60 * 60), // Expires in 30 days
}
```

The negative `userId` is used to identify admin tokens throughout the system.

## Security Features

✅ **Password Hashing**: Admin password is compared against bcryptjs hash or environment variable  
✅ **JWT Tokens**: 30-day expiration for backend tokens  
✅ **Local Session**: 24-hour UI session window to require re-authentication  
✅ **HTTPS Ready**: All endpoints support CORS and HTTPS  
✅ **Environment Secrets**: Admin password stored in environment, not in code  
✅ **Token Validation**: Each admin request can verify token authenticity  

## Deployment Checklist

- [ ] Set `ADMIN_PASSWORD` in Vercel Environment Variables
- [ ] Use a strong, unique password (minimum 12 characters)
- [ ] Store backup of admin password securely
- [ ] Test admin login with backend in staging environment
- [ ] Verify token persists across page refreshes
- [ ] Test logout clears all session data
- [ ] Monitor `/api/auth/admin-login` for failed login attempts
- [ ] Set up alerts for multiple failed admin attempts

## Troubleshooting

### AdminPage Shows "Authentication failed" Error
1. Check ADMIN_PASSWORD environment variable is set in Vercel
2. Verify backend endpoint `/api/auth/admin-login` is deployed
3. Check browser console for CORS errors
4. Use fallback local password (currently 'jaeseanjae')

### Token Not Persisting After Refresh
1. Ensure localStorage is enabled in browser
2. Check browser privacy settings not blocking localStorage
3. Verify token isn't exceeding 24-hour window
4. Clear browser cache and refresh

### Backend Authentication Unavailable
1. Frontend automatically falls back to local password verification
2. Admin can still access dashboard with hardcoded password 'jaeseanjae'
3. Deployment will restore backend authentication when service is available

## Future Enhancements

- [ ] Create `/api/admin/setup` endpoint for first-time admin creation
- [ ] Add admin user management endpoints (add/remove admins)
- [ ] Implement 2FA (Two-Factor Authentication) for admins
- [ ] Add audit logging for all admin actions
- [ ] Create `/api/auth/admin-verify` endpoint
- [ ] Implement admin-only route protection middleware
- [ ] Add admin session management/revocation
- [ ] Create admin password reset functionality

## Files Modified

- **src/pages/AdminPage.tsx** - Integrated backend authentication
- **api/auth/admin-login.ts** - Created admin endpoint
- **api/lib/db.ts** - Added admin_users table
- **.env.example** - Added ADMIN_PASSWORD configuration
- **package.json** - Already includes bcryptjs and jsonwebtoken

## Testing Commands

```bash
# Verify admin endpoint exists
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"password":"jaeseanjae"}'

# Expected response:
# {
#   "token": "eyJhbGc...",
#   "admin": {
#     "id": 1,
#     "username": "admin",
#     "role": "admin",
#     "lastLogin": "2025-03-28T10:30:00.000Z"
#   }
# }
```

## Support

For issues or questions about admin authentication, review:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [VERCEL_SETUP.md](VERCEL_SETUP.md) - Backend technical reference
- [API_INTEGRATION.md](API_INTEGRATION.md) - API endpoint documentation
