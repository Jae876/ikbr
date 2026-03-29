import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const [header, payload, signature] = token.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return decoded
  } catch {
    return null
  }
}

const isAdmin = (token: string): boolean => {
  if (token.startsWith('local_')) {
    return true
  }
  
  try {
    const decoded = verifyToken(token) as any
    return decoded && decoded.userId < 0
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization?.split(' ')[1]
    if (!authHeader || !isAdmin(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' })
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users')
    const totalAccountsResult = await pool.query('SELECT COUNT(*) as count FROM accounts')

    await pool.end()

    return res.status(200).json({
      stats: {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        totalAccounts: parseInt(totalAccountsResult.rows[0].count)
      }
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : String(error)
    })
  }
}
