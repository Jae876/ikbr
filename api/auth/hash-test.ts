import { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

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
