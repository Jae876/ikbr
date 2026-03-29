import { VercelRequest, VercelResponse } from '@vercel/node'
import { pool } from '../lib/db'
import { verifyToken, hashPassword } from '../lib/auth'

// Helper to check if user is admin
const isAdmin = (token: string): boolean => {
  try {
    const decoded = verifyToken(token) as any
    return decoded.userId < 0 // Negative userId indicates admin
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization?.split(' ')[1]
    if (!authHeader || !isAdmin(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if demo user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@example.com']
    )

    if (existingUser.rows.length > 0) {
      return res.status(200).json({
        message: 'Demo user already exists',
        userId: existingUser.rows[0].id
      })
    }

    // Create demo user
    const hashedPassword = await hashPassword('Demo123!@')
    const userResult = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, account_type, created_at_account)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['demo@example.com', hashedPassword, 'Demo', 'Account', 'individual', '2015-01-15']
    )

    const userId = userResult.rows[0].id

    // Create associated account with $2M balance and realistic data
    await pool.query(
      `INSERT INTO accounts (user_id, balance, buying_power, margin_level, deposits, gains)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 2000000, 4000000, 0.5, 500000, 1500000]
    )

    return res.status(201).json({
      message: 'Demo user created successfully',
      userId,
      email: 'demo@example.com',
      password: 'Demo123!@',
      balance: 2000000
    })
  } catch (error) {
    console.error('Demo seed endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
