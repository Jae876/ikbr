import { VercelRequest, VercelResponse } from '@vercel/node'
import { pool } from '../lib/db'
import { verifyToken } from '../lib/auth'

// Helper to check if user is admin
const isAdmin = (token: string): boolean => {
  // Check for local fallback token (used when backend auth unavailable)
  if (token.startsWith('local_')) {
    return true
  }
  
  // Check for JWT token
  try {
    const decoded = verifyToken(token) as any
    return decoded && decoded.userId < 0 // Negative userId indicates admin
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const authHeader = req.headers.authorization?.split(' ')[1]
    if (!authHeader || !isAdmin(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // GET all users
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.account_type,
          u.created_at_account,
          a.balance,
          a.buying_power,
          COUNT(t.id) as transaction_count
        FROM users u
        LEFT JOIN accounts a ON u.id = a.user_id
        LEFT JOIN transactions t ON a.id = t.account_id
        GROUP BY u.id, a.id
        ORDER BY u.created_at DESC
      `)
      
      return res.status(200).json({
        users: result.rows
      })
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { userId, firstName, lastName, accountType } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'userId required' })
      }

      await pool.query(`
        UPDATE users 
        SET first_name = $1, last_name = $2, account_type = $3, updated_at = NOW()
        WHERE id = $4
      `, [firstName, lastName, accountType, userId])

      return res.status(200).json({ message: 'User updated successfully' })
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { userId } = req.body

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
