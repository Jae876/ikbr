import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '../lib/auth'

const INITIAL_BALANCE = 50000

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  let pool: Pool | null = null

  try {
    const { firstName, lastName, email, password } = req.body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password too weak' })
    }

    // Create connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' })
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    })

    // Create users table if doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create accounts table if doesn't exist
    await pool.query(`
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

    // Check if email exists
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (checkEmail.rows.length > 0) {
      await pool.end()
      return res.status(409).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert user
    const userRes = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName]
    )

    const user = userRes.rows[0]

    // Insert account
    const accountRes = await pool.query(
      'INSERT INTO accounts (user_id, balance, buying_power, total_deposits, unrealized_gains) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, INITIAL_BALANCE, INITIAL_BALANCE * 0.5, 0, 0]
    )

    const account = accountRes.rows[0]
    const token = generateToken(user.id, user.email)

    await pool.end()

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        account: {
          balance: parseFloat(account.balance),
          buyingPower: parseFloat(account.buying_power)
        }
      }
    })
  } catch (error) {
    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        // Ignore
      }
    }

    console.error('Signup error:', error)
    const msg = error instanceof Error ? error.message : String(error)

    return res.status(500).json({
      message: 'Signup failed',
      error: msg
    })
  }
}
