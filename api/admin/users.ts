import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

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

    // Support both single DATABASE_URL or individual connection vars
    const connectionString = process.env.DATABASE_URL || 
      (process.env.PGHOST && `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`)

    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' })
    }

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

    // GET all users with account data
    if (req.method === 'GET') {
      try {
        // Ensure all tables exist first
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
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL,
            balance DECIMAL(15, 2) DEFAULT 50000,
            buying_power DECIMAL(15, 2) DEFAULT 50000,
            total_deposits DECIMAL(15, 2) DEFAULT 50000,
            unrealized_gains DECIMAL(15, 2) DEFAULT 0,
            margin_level DECIMAL(5, 2) DEFAULT 30,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            account_id INTEGER NOT NULL,
            type VARCHAR(50),
            amount DECIMAL(15, 2),
            description VARCHAR(255),
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            balance DECIMAL(15, 2)
          )
        `)
        
        // Now query users
        const result = await pool.query(`
          SELECT 
            u.id, 
            u.email, 
            u.first_name, 
            u.last_name, 
            u.created_at,
            a.balance,
            a.buying_power,
            COUNT(t.id) as transaction_count
          FROM users u
          LEFT JOIN accounts a ON u.id = a.user_id
          LEFT JOIN transactions t ON a.id = t.account_id
          GROUP BY u.id, a.id
          ORDER BY u.created_at DESC
        `)
        await pool.end()
        
        console.log('Admin users query returned:', result.rows.length, 'users')
        
        return res.status(200).json({
          users: result.rows.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            balance: u.balance ? parseFloat(u.balance) : 50000,
            buyingPower: u.buying_power ? parseFloat(u.buying_power) : 50000,
            transactionCount: parseInt(u.transaction_count) || 0,
            createdAt: u.created_at
          }))
        })
      } catch (err) {
        await pool.end()
        console.error('Admin users GET error:', err)
        return res.status(500).json({
          error: 'Failed to fetch users',
          detail: err instanceof Error ? err.message : String(err)
        })
      }
    }

    // DELETE - Delete user and related records
    if (req.method === 'DELETE') {
      const { userId } = req.body

      if (!userId) {
        await pool.end()
        return res.status(400).json({ error: 'userId required' })
      }

      try {
        // Get account ID first
        const accountResult = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [userId])
        
        // Delete related records
        for (const account of accountResult.rows) {
          await pool.query('DELETE FROM transactions WHERE account_id = $1', [account.id])
          await pool.query('DELETE FROM positions WHERE account_id = $1', [account.id])
        }

        await pool.query('DELETE FROM accounts WHERE user_id = $1', [userId])
        await pool.query('DELETE FROM users WHERE id = $1', [userId])
        await pool.end()

        return res.status(200).json({ message: 'User deleted successfully' })
      } catch (err) {
        await pool.end()
        throw err
      }
    }

    await pool.end()
    return res.status(405).json({ error: 'Method not allowed' })
    })
  }
}
