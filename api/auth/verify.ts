import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { verifyToken } from '../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
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

    // Get user data
    const userResult = await query('SELECT * FROM users WHERE id = $1', [decoded.userId])
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    const accountResult = await query('SELECT * FROM accounts WHERE user_id = $1', [user.id])
    const positionsResult = await query('SELECT * FROM positions WHERE account_id = $1', [accountResult.rows[0]?.id])
    const transactionsResult = await query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY date DESC LIMIT 100', [accountResult.rows[0]?.id])

    const account = accountResult.rows[0]
    const positions = positionsResult.rows.map(p => ({
      symbol: p.symbol,
      quantity: p.quantity,
      avgCost: parseFloat(p.avg_cost),
      currentPrice: parseFloat(p.current_price),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_pl_percent)
    }))

    const transactions = transactionsResult.rows.map(t => ({
      date: t.date,
      type: t.type,
      amount: parseFloat(t.amount),
      description: t.description,
      balance: parseFloat(t.balance)
    }))

    return res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountType: user.account_type,
        account: {
          id: account.id,
          balance: parseFloat(account.balance),
          buyingPower: parseFloat(account.buying_power),
          marginLevel: parseFloat(account.margin_level),
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          createdAt: user.created_at_account,
          positions,
          transactions
        }
      }
    })
  } catch (error) {
    console.error('Verify error:', error)
    return res.status(500).json({
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}
