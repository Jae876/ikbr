import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import crypto from 'crypto'

// Inline from lib/auth
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(key == derivedKey.toString('hex'))
    })
  })
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateToken(userId: number, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ 
    userId, 
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret').update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

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

    console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 30) + '...')

    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    })

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
