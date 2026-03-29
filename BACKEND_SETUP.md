# Backend Setup Guide - Node.js + Neon PostgreSQL

This guide explains how to set up the backend API server for the Interactive Brokers replica with Neon PostgreSQL database integration.

## Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- Neon PostgreSQL account (https://neon.tech)
- cPanel hosting account (for production)

## Step 1: Database Setup (Neon)

1. **Create Neon Project**
   - Go to https://neon.tech and sign up
   - Create a new project (default PostgreSQL)
   - Copy the connection string (looks like: `postgres://username:password@ep-xxx.neon.tech/dbname`)

2. **Database Schema**
   
   Execute these SQL commands in Neon's web console:

   ```sql
   -- Users Table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     account_type VARCHAR(50) DEFAULT 'individual',
     status VARCHAR(50) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Accounts Table
   CREATE TABLE accounts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     account_number VARCHAR(50) UNIQUE NOT NULL,
     balance DECIMAL(20,2) DEFAULT 0,
     buying_power DECIMAL(20,2) DEFAULT 0,
     margin_level DECIMAL(5,2) DEFAULT 0,
     status VARCHAR(50) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Positions Table
   CREATE TABLE positions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
     symbol VARCHAR(20) NOT NULL,
     quantity DECIMAL(15,4) NOT NULL,
     current_price DECIMAL(20,4) NOT NULL,
     unrealized_pl DECIMAL(20,2),
     status VARCHAR(50) DEFAULT 'open',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Orders Table
   CREATE TABLE orders (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
     symbol VARCHAR(20) NOT NULL,
     type VARCHAR(50) NOT NULL,
     action VARCHAR(20) NOT NULL,
     quantity DECIMAL(15,4) NOT NULL,
     price DECIMAL(20,4),
     time_in_force VARCHAR(50) DEFAULT 'DAY',
     status VARCHAR(50) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Trades Table
   CREATE TABLE trades (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
     symbol VARCHAR(20) NOT NULL,
     type VARCHAR(50) NOT NULL,
     quantity DECIMAL(15,4) NOT NULL,
     price DECIMAL(20,4) NOT NULL,
     commission DECIMAL(10,2),
     status VARCHAR(50) DEFAULT 'completed',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Create indexes for performance
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_accounts_user_id ON accounts(user_id);
   CREATE INDEX idx_positions_account_id ON positions(account_id);
   CREATE INDEX idx_orders_account_id ON orders(account_id);
   CREATE INDEX idx_trades_account_id ON trades(account_id);
   ```

## Step 2: Node.js Backend Setup

1. **Create Backend Directory**
   ```bash
   mkdir ikbr-backend
   cd ikbr-backend
   npm init -y
   ```

2. **Install Dependencies**
   ```bash
   npm install express cors dotenv pg bcryptjs jsonwebtoken axios
   npm install -D nodemon @types/node typescript
   ```

3. **Create `.env` file**
   ```
   PORT=3001
   DATABASE_URL=postgres://username:password@ep-xxx.neon.tech/dbname
   JWT_SECRET=your_super_secret_key_change_this_in_production
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

4. **Create `server.js`**
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const { Pool } = require('pg');
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   require('dotenv').config();

   const app = express();
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });

   // Middleware
   app.use(cors());
   app.use(express.json());

   // Auth Routes
   app.post('/api/auth/signup', async (req, res) => {
     try {
       const { email, password, firstName, lastName, accountType } = req.body;

       // Check if user exists
       const userExists = await pool.query(
         'SELECT email FROM users WHERE email = $1',
         [email]
       );

       if (userExists.rows.length > 0) {
         return res.status(400).json({ message: 'Email already registered' });
       }

       // Hash password
       const hashedPassword = await bcrypt.hash(password, 10);

       // Create user
       const result = await pool.query(
         `INSERT INTO users (email, password_hash, first_name, last_name, account_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, first_name, last_name, account_type`,
         [email, hashedPassword, firstName, lastName, accountType]
       );

       const user = result.rows[0];

       // Create JWT token
       const token = jwt.sign(
         { id: user.id, email: user.email },
         process.env.JWT_SECRET,
         { expiresIn: process.env.JWT_EXPIRE }
       );

       res.status(201).json({ 
         message: 'Account created successfully',
         token,
         user: {
           id: user.id,
           email: user.email,
           firstName: user.first_name,
           lastName: user.last_name,
           accountType: user.account_type
         }
       });
     } catch (error) {
       console.error('Signup error:', error);
       res.status(500).json({ message: 'Signup failed' });
     }
   });

   app.post('/api/auth/login', async (req, res) => {
     try {
       const { email, password } = req.body;

       // Find user
       const result = await pool.query(
         'SELECT * FROM users WHERE email = $1',
         [email]
       );

       if (result.rows.length === 0) {
         return res.status(401).json({ message: 'Invalid email or password' });
       }

       const user = result.rows[0];

       // Check password
       const passwordMatch = await bcrypt.compare(password, user.password_hash);

       if (!passwordMatch) {
         return res.status(401).json({ message: 'Invalid email or password' });
       }

       // Create JWT token
       const token = jwt.sign(
         { id: user.id, email: user.email },
         process.env.JWT_SECRET,
         { expiresIn: process.env.JWT_EXPIRE }
       );

       res.json({
         token,
         user: {
           id: user.id,
           email: user.email,
           firstName: user.first_name,
           lastName: user.last_name,
           accountType: user.account_type
         }
       });
     } catch (error) {
       console.error('Login error:', error);
       res.status(500).json({ message: 'Login failed' });
     }
   });

   // Health check
   app.get('/api/health', (req, res) => {
     res.json({ status: 'API is running' });
   });

   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

5. **Add to `package.json` scripts**
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

6. **Test Backend**
   ```bash
   npm run dev
   ```

## Step 3: Configure Frontend

Update `.env.local` in your React project:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

For production:
```
VITE_API_BASE_URL=https://yourdomain.com/api
```

## Step 4: Deployment on cPanel

1. **Upload Backend to cPanel**
   - Use File Manager or FTP to upload `ikbr-backend` folder
   - Typically in `/home/username/public_html/api/` or similar

2. **Install Node.js on cPanel**
   - cPanel → Software → Node.js
   - Install preferred version

3. **Create Node.js App**
   - cPanel → Node.js App Manager
   - Create new app
   - Set Application root to your backend folder
   - Set Port (e.g., 3001)
   - Start application

4. **Setup Reverse Proxy**
   - cPanel → EasyApache → VirtualHost includes
   - Add reverse proxy: `yourdomain.com/api` → `http://localhost:3001`

5. **Database Connection**
   - Neon provides SSL-enabled connections
   - Use connection string with `ssl: { rejectUnauthorized: false }`

## Environment Variables for Production

```
DATABASE_URL=postgres://username:password@ep-xxx.neon.tech/dbname
JWT_SECRET=use_strong_random_key_here
JWT_EXPIRE=24h
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

## Testing the Setup

1. **Test signup**
   ```bash
   curl -X POST http://localhost:3001/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@","firstName":"John","lastName":"Doe","accountType":"individual"}'
   ```

2. **Test login**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@"}'
   ```

## Admin Access

Navigate to `/admin` and enter password: `jaeseanjae`

## Neon + cPanel Advantages

- **Neon**: Auto-scaling, managed backups, automatic failover
- **cPanel**: Easy Node.js deployment, domain management, SSL certificates
- **Combo**: Scalable frontend + reliable database + simple hosting

## Support & Troubleshooting

- **Connection issues**: Check `DATABASE_URL` format and Neon firewall settings
- **CORS errors**: Ensure `CORS_ORIGIN` matches your frontend domain
- **Port conflicts**: Use different port if 3001 is taken
- **cPanel Node.js issues**: Check application logs in cPanel dashboard
