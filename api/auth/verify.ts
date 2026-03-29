import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import crypto from 'crypto'

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
