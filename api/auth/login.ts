import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { comparePassword, generateToken, isValidEmail } from '../lib/auth'

async function ensureTablesExist() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        account_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        balance DECIMAL(15, 2),
        buying_power DECIMAL(15, 2),
        total_deposits DECIMAL(15, 2),
        unrealized_gains DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER,
        symbol VARCHAR(10),
        quantity INTEGER,
        avg_cost DECIMAL(10, 2),
        current_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER,
        date VARCHAR(10),
        type VARCHAR(50),
        amount DECIMAL(15, 2),
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    // Ignore - tables may exist
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await ensureTablesExist()

    const { email, password } = req.body

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    // Get user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email])

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = userResult.rows[0]
    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get account
    const accountResult = await query('SELECT * FROM accounts WHERE user_id = $1', [user.id])

    if (accountResult.rows.length === 0) {
      return res.status(500).json({ message: 'Account not found' })
    }

    const account = accountResult.rows[0]

    // Get positions
    const positionsResult = await query('SELECT * FROM positions WHERE account_id = $1 ORDER BY created_at DESC', [account.id])

    // Get transactions
    const transactionsResult = await query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 50', [account.id])

    const token = generateToken(user.id, user.email)

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
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          positions: positionsResult.rows.map((p: any) => ({
            id: p.id,
            symbol: p.symbol,
            quantity: p.quantity,
            avgCost: parseFloat(p.avg_cost),
            currentPrice: parseFloat(p.current_price)
          })),
          transactions: transactionsResult.rows.map((t: any) => ({
            id: t.id,
            date: t.date,
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description
          }))
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      message: 'Login failed',
      error: msg
    })
  }
}
