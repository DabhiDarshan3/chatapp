import { useCallback, type ChangeEvent } from 'react'
import type { ModelsData } from '../../types'

interface ModelSelectorProps {
  models: ModelsData
  selectedProvider: string
  selectedModel: string
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
}

export default function ModelSelector({
  models,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}: ModelSelectorProps) {
  const handleChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const [provider, ...modelParts] = e.target.value.split(':')
    const model = modelParts.join(':')
    onProviderChange(provider)
    onModelChange(model)
  }, [onProviderChange, onModelChange])

  const currentValue = `${selectedProvider}:${selectedModel}`

  return (
    <div className="px-3 pb-3">
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest
                        mb-1.5 block px-1">
        Model
      </label>
      <div className="relative">
        <select
          value={currentValue}
          onChange={handleChange}
          className="w-full appearance-none bg-gray-800 border border-gray-700
                     text-gray-300 text-sm rounded-xl px-3 py-2.5 pr-8
                     focus:outline-none focus:border-indigo-500 focus:ring-1
                     focus:ring-indigo-500 transition-colors cursor-pointer"
        >
          {Object.entries(models).map(([providerId, providerData]) => (
            <optgroup key={providerId} label={`${providerData.icon} ${providerData.label}`}>
              {Object.entries(providerData.models).map(([modelId, modelData]) => (
                <option key={modelId} value={`${providerId}:${modelId}`}>
                  {modelData.label}{modelData.badge ? ` — ${modelData.badge}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>
  )
}
