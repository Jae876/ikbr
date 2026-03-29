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
    console.log('[SIGNUP] Request received')

    const { firstName, lastName, email, password } = req.body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      console.log('[SIGNUP] Missing fields:', { firstName, lastName, email, password: '***' })
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!isValidEmail(email)) {
      console.log('[SIGNUP] Invalid email:', email)
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!isValidPassword(password)) {
      console.log('[SIGNUP] Invalid password format')
      return res.status(400).json({ message: 'Password too weak' })
    }

    console.log('[SIGNUP] Validation passed for:', email)

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('[SIGNUP] DATABASE_URL not set!')
      return res.status(500).json({
        message: 'Database not configured',
        error: 'DATABASE_URL environment variable is missing'
      })
    }

    console.log('[SIGNUP] Creating database connection...')

    // Create connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 10000
    })

    pool.on('error', (err) => {
      console.error('[POOL ERROR]', err)
    })

    console.log('[SIGNUP] Creating users table...')

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

    console.log('[SIGNUP] Creating accounts table...')

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

    console.log('[SIGNUP] Tables ready, checking if email exists...')

    // Check if email exists
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (checkEmail.rows.length > 0) {
      console.log('[SIGNUP] Email already registered:', email)
      await pool.end()
      return res.status(409).json({ message: 'Email already registered' })
    }

    console.log('[SIGNUP] Hashing password...')

    // Hash password
    const hashedPassword = await hashPassword(password)

    console.log('[SIGNUP] Inserting user...')

    // Insert user
    const userRes = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName]
    )

    const user = userRes.rows[0]
    console.log('[SIGNUP] User created:', user.id)

    console.log('[SIGNUP] Inserting account...')

    // Insert account
    const accountRes = await pool.query(
      'INSERT INTO accounts (user_id, balance, buying_power, total_deposits, unrealized_gains) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, INITIAL_BALANCE, INITIAL_BALANCE * 0.5, 0, 0]
    )

    const account = accountRes.rows[0]
    console.log('[SIGNUP] Account created:', account.id)

    const token = generateToken(user.id, user.email)

    console.log('[SIGNUP] Success for:', email)

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
    console.error('[SIGNUP ERROR]', error)

    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        console.error('[POOL END ERROR]', e)
      }
    }

    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''

    console.error('[SIGNUP STACK]', stack)

    return res.status(500).json({
      message: 'Signup failed',
      error: msg,
      details: process.env.NODE_ENV === 'development' ? stack : undefined
    })
  }
}
