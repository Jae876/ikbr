import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '../lib/auth'

const INITIAL_BALANCE = 50000

async function ensureTablesExist() {
  try {
    // Try to create tables (idempotent - won't fail if they exist)
    await query(`
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
      )
    `)

    await query(`
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
      )
    `)

    await query(`
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
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(255),
        balance DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    console.warn('Table creation warning:', err instanceof Error ? err.message : err)
    // Ignore errors - tables might already exist
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Ensure tables exist (silent)
    await ensureTablesExist()
    
    const { firstName, lastName, email, password, accountType } = req.body

    // Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'First and last names are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters, uppercase, lowercase, number, and special character'
      })
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password, first_name, last_name, account_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, account_type, created_at_account',
      [email, hashedPassword, firstName.trim(), lastName.trim(), accountType || 'individual']
    )

    const user = userResult.rows[0]
    const accountCreatedAt = user.created_at_account

    // Create associated account
    const accountResult = await query(
      'INSERT INTO accounts (user_id, balance, buying_power, total_deposits, unrealized_gains) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, INITIAL_BALANCE, INITIAL_BALANCE * 0.5, 0, 0]
    )

    const account = accountResult.rows[0]

    // Generate token
    const token = generateToken(user.id, user.email)

    // Return user data
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountType: user.account_type,
        account: {
          id: account.id,
          balance: parseFloat(account.balance),
          buyingPower: parseFloat(account.buying_power),
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          createdAt: accountCreatedAt,
          positions: [],
          transactions: []
        }
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      message: 'Signup failed',
      error: errorMessage
    })
  }
}
