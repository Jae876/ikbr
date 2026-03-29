import { Pool, QueryResult } from 'pg'

let pool: Pool | null = null
let initPromise: Promise<void> | null = null
let initAttempted = false

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
    
    pool.on('error', (err) => {
      console.error('Pool error:', err)
    })
  }
  return pool
}

export async function ensureTablesExist(): Promise<void> {
  // Skip if already attempted in this process
  if (initAttempted && initPromise) {
    return initPromise
  }
  
  if (!initPromise) {
    initPromise = initDatabase().catch(err => {
      console.error('Database init failed:', err.message)
      throw err
    })
    initAttempted = true
  }
  
  return initPromise
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const pool = getPool()
  return pool.query(text, params)
}

export async function initDatabase() {
  try {
    const pool = getPool()
    
    // Set a timeout for table creation (10 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
    )
    
    const initPromiseInstance = Promise.all([
      pool.query(`
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
      `),
      pool.query(`
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
      `),
      pool.query(`
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
      `),
      pool.query(`
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
      `),
      pool.query(`
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
    ])
    
    await Promise.race([initPromiseInstance, timeoutPromise])
    console.log('Database tables ready')
  } catch (err) {
    if (err instanceof Error && err.message === 'Database initialization timeout') {
      console.warn('Database init timeout, tables may already exist')
      return
    }
    throw err
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
