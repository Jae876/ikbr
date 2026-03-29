import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { comparePassword, generateToken, isValidEmail } from '../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
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

  try {
    const { email, password } = req.body

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' })
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    // Get user
    const userResult = await query('SELECT id, email, password, first_name, last_name FROM users WHERE email = $1', [email])

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = userResult.rows[0]
    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get account
    const accountResult = await query('SELECT * FROM accounts WHERE user_id = $1', [user.id])

    if (accountResult.rows.length === 0) {
      return res.status(500).json({ message: 'Account not found' })
    }

    const account = accountResult.rows[0]

    // Get positions
    const positionsResult = await query('SELECT * FROM positions WHERE account_id = $1 ORDER BY created_at DESC', [account.id])

    // Get transactions
    const transactionsResult = await query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 50', [account.id])

    const token = generateToken(user.id, user.email)

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        account: {
          id: account.id,
          balance: parseFloat(account.balance),
          buyingPower: parseFloat(account.buying_power),
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          positions: positionsResult.rows.map((p: any) => ({
            id: p.id,
            symbol: p.symbol,
            quantity: p.quantity,
            avgCost: parseFloat(p.avg_cost),
            currentPrice: parseFloat(p.current_price),
            unrealizedPl: p.unrealized_pl,
            unrealizedPlPercent: p.unrealized_pl_percent
          })),
          transactions: transactionsResult.rows.map((t: any) => ({
            id: t.id,
            date: t.date,
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description
          }))
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      message: 'Login failed',
      error: errorMessage
    })
  }
}
