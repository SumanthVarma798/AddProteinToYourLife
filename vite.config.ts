import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import {
  adaptRecipeFromLlm,
  generateRecipesFromLlm,
  type AdaptBody,
  type GenerateBody,
} from './server/llm.ts'

function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function localLlmApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-llm-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const runtimeEnv = { ...process.env, ...env }

        try {
          const body = await readJsonBody(req)
          if (req.url.startsWith('/api/recipes')) {
            const recipes = await generateRecipesFromLlm(
              body as GenerateBody,
              runtimeEnv,
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ recipes, source: 'llm' }))
            return
          }
          if (req.url.startsWith('/api/adapt')) {
            const result = await adaptRecipeFromLlm(
              body as AdaptBody,
              runtimeEnv,
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ...result, source: 'llm' }))
            return
          }
          next()
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          res.statusCode = message === 'NO_API_KEY' ? 503 : 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      localLlmApiPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Add Protein to Your Life',
          short_name: 'Add Protein',
          description:
            'Elderly-friendly protein side-dish companion for South Indian meals',
          theme_color: '#059669',
          background_color: '#FAFAFA',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
  }
})
