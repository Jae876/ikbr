import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'
import { comparePassword, generateToken, hashPassword } from '../lib/auth'

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
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    // Get admin user (there should be only one admin in the system)
    const adminResult = await query('SELECT * FROM admin_users WHERE role = $1 LIMIT 1', ['admin'])

    if (adminResult.rows.length === 0) {
      // First time setup - no admin exists yet
      // For security, the first admin must be set up manually or via environment variable
      return res.status(500).json({ message: 'Admin not configured' })
    }

    const admin = adminResult.rows[0]

    // Verify password
    const isPasswordValid = password === process.env.ADMIN_PASSWORD || 
                          await comparePassword(password, admin.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid admin password' })
    }

    // Update last login
    await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [admin.id])

    // Generate token (use admin ID as negative to distinguish from regular users)
    const token = generateToken(-admin.id, `admin_${admin.username}`)

    return res.status(200).json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.last_login
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return res.status(500).json({
      message: 'Admin login failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}
