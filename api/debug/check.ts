import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    // 1. Check DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL not set',
        env_keys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('NEON'))
      })
    }

    console.log('DATABASE_URL exists, attempting connection...')

    // 2. Try to connect
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // 3. Run test query
    const result = await pool.query('SELECT NOW()')
    
    console.log('Connection successful: ', result.rows[0])

    // 4. Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      )
    `)

    const usersTableExists = tableCheck.rows[0].exists

    await pool.end()

    return res.status(200).json({
      status: 'success',
      database_connected: true,
      current_time: result.rows[0].now,
      users_table_exists: usersTableExists,
      message: 'Database is working'
    })
  } catch (error) {
    console.error('Debug check failed:', error)
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
