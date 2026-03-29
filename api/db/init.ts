import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let pool: Pool | null = null

  try {
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'DATABASE_URL not configured',
        message: 'Set DATABASE_URL environment variable in Vercel'
      })
    }

    // Create connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // Test connection
    const testResult = await pool.query('SELECT NOW()')
    console.log('Database connected:', testResult.rows[0])

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        account_type VARCHAR(50) DEFAULT 'individual',
        created_at_account TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ users table created')

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0,
        buying_power DECIMAL(15, 2) DEFAULT 0,
        margin_level DECIMAL(5, 2) DEFAULT 2.0,
        total_deposits DECIMAL(15, 2) DEFAULT 0,
        unrealized_gains DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ accounts table created')

    // Create positions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        avg_cost DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2) NOT NULL,
        unrealized_pl DECIMAL(15, 2),
        unrealized_pl_percent DECIMAL(10, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ positions table created')

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(255),
        balance DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ transactions table created')

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ admin_users table created')

    await pool.end()

    return res.status(200).json({
      success: true,
      message: 'All tables created successfully'
    })
  } catch (error) {
    console.error('Database init error:', error)
    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        console.error('Error closing pool:', e)
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return res.status(500).json({
      error: 'Database initialization failed',
      message: errorMessage,
      hint: 'Check that DATABASE_URL is correct and Neon database is accessible'
    })
  }
}

  let pool: Pool | null = null

  try {
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'DATABASE_URL not configured',
        message: 'Set DATABASE_URL environment variable in Vercel'
      })
    }

    // Create connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // Test connection
    const testResult = await pool.query('SELECT NOW()')
    console.log('Database connected:', testResult.rows[0])

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        account_type VARCHAR(50) DEFAULT 'individual',
        created_at_account TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ users table created')

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0,
        buying_power DECIMAL(15, 2) DEFAULT 0,
        margin_level DECIMAL(5, 2) DEFAULT 2.0,
        total_deposits DECIMAL(15, 2) DEFAULT 0,
        unrealized_gains DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ accounts table created')

    // Create positions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        avg_cost DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2) NOT NULL,
        unrealized_pl DECIMAL(15, 2),
        unrealized_pl_percent DECIMAL(10, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ positions table created')

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(255),
        balance DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ transactions table created')

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ admin_users table created')

    await pool.end()

    return res.status(200).json({
      success: true,
      message: 'All tables created successfully'
    })
  } catch (error) {
    console.error('Database init error:', error)
    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        console.error('Error closing pool:', e)
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return res.status(500).json({
      error: 'Database initialization failed',
      message: errorMessage,
      hint: 'Check that DATABASE_URL is correct and Neon database is accessible'
    })
  }
}
