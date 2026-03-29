import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Check auth header - simple secret check
    const authHeader = req.headers['x-init-token']
    const validTokens = ['init-token-2024', process.env.INIT_SECRET || 'init-token-2024']
    
    if (!authHeader || !validTokens.includes(authHeader as string)) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const results: any = {}

    // 1. Create users table - NO FOREIGN KEYS
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          account_type VARCHAR(50),
          created_at_account TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.users = 'created'
    } catch (e) {
      results.users = 'exists or error'
    }

    // 2. Create accounts table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL,
          balance DECIMAL(15, 2),
          buying_power DECIMAL(15, 2),
          total_deposits DECIMAL(15, 2),
          unrealized_gains DECIMAL(15, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.accounts = 'created'
    } catch (e) {
      results.accounts = 'exists or error'
    }

    // 3. Create positions table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS positions (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          symbol VARCHAR(10),
          quantity INTEGER,
          avg_cost DECIMAL(10, 2),
          current_price DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.positions = 'created'
    } catch (e) {
      results.positions = 'exists or error'
    }

    // 4. Create transactions table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          date VARCHAR(10),
          type VARCHAR(50),
          amount DECIMAL(15, 2),
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.transactions = 'created'
    } catch (e) {
      results.transactions = 'exists or error'
    }

    // 5. Create admin_users table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE,
          password VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.admin_users = 'created'
    } catch (e) {
      results.admin_users = 'exists or error'
    }

    return res.status(200).json({
      message: 'Database initialization complete',
      tables: results
    })
  } catch (error) {
    console.error('Init error:', error)
    return res.status(500).json({
      message: 'Initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
