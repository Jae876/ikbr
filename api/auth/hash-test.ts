import { VercelRequest, VercelResponse } from '@vercel/node'
import { hashPassword } from '../lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const start = Date.now()
    const hash = await hashPassword('TestPassword123!')
    const elapsed = Date.now() - start

    return res.json({ 
      status: 'Password hashed',
      time_ms: elapsed,
      hash_length: hash.length
    })
  } catch (e) {
    return res.status(500).json({ 
      error: String(e)
    })
  }
}
