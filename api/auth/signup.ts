import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Weak password' })
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not set' })
    }

    // Single connection for this request only
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

    // Create users table
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

    // Create accounts table
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

    // Check email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      await pool.end()
      return res.status(409).json({ message: 'Email exists' })
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
      [user.id, 50000, 25000, 0, 0]
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
        account: { balance: parseFloat(account.balance), buyingPower: parseFloat(account.buying_power) }
      }
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
