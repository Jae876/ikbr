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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

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

    // Get all dashboard stats
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users')
    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM transactions WHERE date >= NOW() - INTERVAL '30 days'
    `)
    const totalVolumeResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE type IN ('deposit', 'withdrawal')
    `)
    const totalDepositsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'deposit'
    `)
    const totalAccountsResult = await pool.query('SELECT COUNT(*) as count FROM accounts')
    const avgBalanceResult = await pool.query('SELECT COALESCE(AVG(balance), 0) as avg FROM accounts')

    return res.status(200).json({
      stats: {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        totalVolume: parseFloat(totalVolumeResult.rows[0].total),
        totalDeposits: parseFloat(totalDepositsResult.rows[0].total),
        totalAccounts: parseInt(totalAccountsResult.rows[0].count),
        averageBalance: parseFloat(avgBalanceResult.rows[0].avg)
      }
    })
  } catch (error) {
    console.error('Admin stats endpoint error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
