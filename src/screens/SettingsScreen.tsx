import { useEffect, useState } from 'react'
import { PrimaryButton } from '../components/PrimaryButton'
import { getSetting, setSetting } from '../db'
import type { LlmProvider } from '../types'

type Props = {
  onClose: () => void
}

export function SettingsScreen({ onClose }: Props) {
  const [provider, setProvider] = useState<LlmProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void (async () => {
      setProvider(((await getSetting('LLM_PROVIDER')) as LlmProvider) || 'gemini')
      setApiKey((await getSetting('API_KEY')) || '')
      setBaseUrl((await getSetting('API_BASE_URL')) || '')
      setModel((await getSetting('LLM_MODEL')) || '')
    })()
  }, [])

  async function handleSave() {
    await setSetting('LLM_PROVIDER', provider)
    await setSetting('API_KEY', apiKey.trim())
    await setSetting('API_BASE_URL', baseUrl.trim())
    await setSetting('LLM_MODEL', model.trim())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-base text-muted">
          Recipes use the family Gemini key on the server by default, so Mom
          does not need to type anything. Optional personal key below is only a
          backup override on this device.
        </p>
      </div>

      <label className="block text-left">
        <span className="mb-2 block text-sm font-semibold">
          Backup provider override
        </span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
          className="touch-target w-full rounded-xl border-2 border-border bg-surface px-3 text-base"
        >
          <option value="gemini">Gemini (default)</option>
          <option value="openai">OpenAI</option>
          <option value="custom">Custom OpenAI-compatible URL</option>
        </select>
      </label>

      <label className="block text-left">
        <span className="mb-2 block text-sm font-semibold">
          Personal API key (optional)
        </span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Leave blank to use server key"
          className="touch-target w-full rounded-xl border-2 border-border bg-surface px-3 text-base"
          autoComplete="off"
        />
      </label>

      {provider === 'custom' ? (
        <label className="block text-left">
          <span className="mb-2 block text-sm font-semibold">
            API base URL
          </span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://example.com/v1"
            className="touch-target w-full rounded-xl border-2 border-border bg-surface px-3 text-base"
          />
        </label>
      ) : null}

      <label className="block text-left">
        <span className="mb-2 block text-sm font-semibold">
          Model (optional)
        </span>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={
            provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'
          }
          className="touch-target w-full rounded-xl border-2 border-border bg-surface px-3 text-base"
        />
      </label>

      {saved ? (
        <p className="text-sm font-semibold text-primary" role="status">
          Saved on this device.
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 safe-bottom">
        <PrimaryButton onClick={() => void handleSave()}>
          Save Settings
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onClose}>
          Close
        </PrimaryButton>
      </div>
    </div>
  )
}
