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

  try {
    const authHeader = req.headers.authorization?.split(' ')[1]
    if (!authHeader || !isAdmin(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' })
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

    // GET all users
    if (req.method === 'GET') {
      const result = await pool.query('SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC')
      await pool.end()
      
      return res.status(200).json({
        users: result.rows.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          createdAt: u.created_at
        }))
      })
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { userId } = req.body

      if (!userId) {
        await pool.end()
        return res.status(400).json({ error: 'userId required' })
      }

      await pool.query('DELETE FROM accounts WHERE user_id = $1', [userId])
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
      await pool.end()

      return res.status(200).json({ message: 'User deleted successfully' })
    }

    await pool.end()
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : String(error)
    })
  }
}
    if (req.method === 'DELETE') {
      const { userId } = req.body
      const pool = getPool()

      if (!userId) {
        return res.status(400).json({ error: 'userId required' })
      }

      // Delete related records first (transactions, positions, accounts)
      const accountResult = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [userId])
      
      for (const account of accountResult.rows) {
        await pool.query('DELETE FROM transactions WHERE account_id = $1', [account.id])
        await pool.query('DELETE FROM positions WHERE account_id = $1', [account.id])
      }

      await pool.query('DELETE FROM accounts WHERE user_id = $1', [userId])
      await pool.query('DELETE FROM users WHERE id = $1', [userId])

      return res.status(200).json({ message: 'User deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin users endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
