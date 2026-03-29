import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    })

    const result = await pool.query('SELECT NOW()')
    await pool.end()

    return res.json({ 
      status: 'Connected to Neon',
      time: result.rows[0].now
    })
  } catch (e) {
    return res.status(500).json({ 
      error: String(e),
      message: e instanceof Error ? e.message : 'Unknown error'
    })
  }
}
