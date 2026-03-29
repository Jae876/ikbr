import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import crypto from 'crypto'

function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const [_header, payload, _signature] = token.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return decoded
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not set' })
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

    // Get user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId])
    
    if (userResult.rows.length === 0) {
      await pool.end()
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    const accountResult = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [user.id])
    
    if (!accountResult.rows[0]) {
      await pool.end()
      return res.status(404).json({ message: 'Account not found' })
    }

    const account = accountResult.rows[0]

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
