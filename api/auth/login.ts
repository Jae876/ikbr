import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { comparePassword, generateToken, isValidEmail } from '../lib/auth'

async function ensureTablesExist() {
  try {
    // Create tables if they don't exist
    await query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      account_type VARCHAR(50) DEFAULT 'individual',
      created_at_account TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    await query(`CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance DECIMAL(15, 2) DEFAULT 0,
      buying_power DECIMAL(15, 2) DEFAULT 0,
      margin_level DECIMAL(5, 2) DEFAULT 2.0,
      total_deposits DECIMAL(15, 2) DEFAULT 0,
      unrealized_gains DECIMAL(15, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
  } catch (err) {
    // Ignore - tables may already exist
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Ensure tables exist
    await ensureTablesExist()
    
    const { email, password } = req.body

    // Validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' })
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    // Find user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email])
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = userResult.rows[0]

    // Check password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get user's account and positions
    const accountResult = await query('SELECT * FROM accounts WHERE user_id = $1', [user.id])
    const positionsResult = await query('SELECT * FROM positions WHERE account_id = $1', [accountResult.rows[0]?.id])
    const transactionsResult = await query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY date DESC LIMIT 100', [accountResult.rows[0]?.id])

    const account = accountResult.rows[0]
    const positions = positionsResult.rows.map(p => ({
      symbol: p.symbol,
      quantity: p.quantity,
      avgCost: parseFloat(p.avg_cost),
      currentPrice: parseFloat(p.current_price),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_pl_percent)
    }))

    const transactions = transactionsResult.rows.map(t => ({
      date: t.date,
      type: t.type,
      amount: parseFloat(t.amount),
      description: t.description,
      balance: parseFloat(t.balance)
    }))

    // Generate token
    const token = generateToken(user.id, user.email)

    // Return user data
    return res.status(200).json({
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
          marginLevel: parseFloat(account.margin_level),
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          createdAt: user.created_at_account,
          positions,
          transactions
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}
