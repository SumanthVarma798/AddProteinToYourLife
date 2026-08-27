import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  adaptRecipeFromLlm,
  resolveMissingIngredients,
  type AdaptBody,
} from '../server/llm.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as AdaptBody
    const missing = resolveMissingIngredients(body || {})
    if (!body?.recipeTitle || !body?.steps || missing.length === 0) {
      return res.status(400).json({ error: 'Invalid body' })
    }
    const result = await adaptRecipeFromLlm({
      ...body,
      missingIngredients: missing,
    })
    return res.status(200).json({ ...result, source: 'llm' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'NO_API_KEY') {
      return res.status(503).json({ error: 'NO_API_KEY' })
    }
    console.error('adapt api error', message)
    return res.status(502).json({ error: message })
  }
}
