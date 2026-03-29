import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '../lib/auth'

const PLATFORM_TARGET = 4000000 // $4M target for 10% rate
const INITIAL_BALANCE = 50000 // Starting balance for new users

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, password, accountType } = req.body

    // Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'First and last names are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters, uppercase, lowercase, number, and special character'
      })
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password, first_name, last_name, account_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, account_type, created_at_account',
      [email, hashedPassword, firstName.trim(), lastName.trim(), accountType || 'individual']
    )

    const user = userResult.rows[0]
    const accountCreatedAt = user.created_at_account

    // Create associated account
    const accountResult = await query(
      'INSERT INTO accounts (user_id, balance, buying_power, total_deposits, unrealized_gains) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, INITIAL_BALANCE, INITIAL_BALANCE * 0.5, 0, 0]
    )

    const account = accountResult.rows[0]

    // Generate token
    const token = generateToken(user.id, user.email)

    // Return user data
    return res.status(201).json({
      token,
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
          totalDeposits: parseFloat(account.total_deposits),
          unrealizedGains: parseFloat(account.unrealized_gains),
          createdAt: accountCreatedAt,
          positions: [],
          transactions: []
        }
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({
      message: 'Signup failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}
