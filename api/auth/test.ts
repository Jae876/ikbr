import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return res.json({ status: 'OK', time: new Date().toISOString() })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
