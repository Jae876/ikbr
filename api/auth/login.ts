import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { comparePassword, generateToken, isValidEmail } from '../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not set' })
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

    // Get user
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (userRes.rows.length === 0) {
      await pool.end()
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = userRes.rows[0]

    // Check password
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      await pool.end()
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get account
    const accountRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [user.id])

    if (accountRes.rows.length === 0) {
      await pool.end()
      return res.status(500).json({ message: 'Account not found' })
    }

    const account = accountRes.rows[0]
    const token = generateToken(user.id, user.email)

    await pool.end()

    return res.status(200).json({
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
    return res.status(500).json({
      message: 'Error',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
