/**
 * AI Agent Rotation System
 * Automatically cycles through multiple LLM providers when usage limits are reached
 *
 * Providers (in priority order):
 * 1. OpenRouter (primary - high limits)
 * 2. OmniRoute (secondary - custom gateway)
 * 3. OpenAI (tertiary)
 * 4. Anthropic (quaternary)
 * 5. FreeLLMAPI (fallback - free tier)
 */

import { z } from 'zod'

interface LLMProvider {
  name: string
  key: string
  baseUrl: string
  model: string
  rateLimit: number
  resetTime: number // in ms
  isActive: boolean
  lastError?: string
  lastErrorTime?: number
  usageCount: number
  lastResetTime: number
}

interface RotationState {
  currentProvider: string
  providers: Record<string, LLMProvider>
  lastRotation: number
  rotationHistory: Array<{ provider: string; timestamp: number; reason: string }>
}

/**
 * Initialize AI provider rotation system from environment variables
 */
export function initializeAIRotation(envVars: Record<string, string>): RotationState {
  const providers: Record<string, LLMProvider> = {}
  const now = Date.now()

  // OpenRouter (Primary)
  if (envVars.OPENROUTER_API_KEY) {
    providers['openrouter'] = {
      name: 'OpenRouter',
      key: envVars.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.io/api/v1',
      model: 'auto',
      rateLimit: 1000,
      resetTime: 60000,
      isActive: true,
      usageCount: 0,
      lastResetTime: now,
    }
  }

  // OmniRoute (Secondary)
  if (envVars.OMNIROUTE_API_KEY) {
    providers['omniroute'] = {
      name: 'OmniRoute',
      key: envVars.OMNIROUTE_API_KEY,
      baseUrl: envVars.OMNIROUTE_BASE_URL || 'https://api.omniroute.ai/v1',
      model: 'gpt-4-turbo',
      rateLimit: 500,
      resetTime: 60000,
      isActive: true,
      usageCount: 0,
      lastResetTime: now,
    }
  }

  // OpenAI (Tertiary)
  if (envVars.OPENAI_API_KEY) {
    providers['openai'] = {
      name: 'OpenAI',
      key: envVars.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo',
      rateLimit: 200,
      resetTime: 60000,
      isActive: true,
      usageCount: 0,
      lastResetTime: now,
    }
  }

  // Anthropic (Quaternary)
  if (envVars.ANTHROPIC_API_KEY) {
    providers['anthropic'] = {
      name: 'Anthropic',
      key: envVars.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-sonnet-20240229',
      rateLimit: 50,
      resetTime: 60000,
      isActive: true,
      usageCount: 0,
      lastResetTime: now,
    }
  }

  // FreeLLMAPI (Fallback)
  if (envVars.FREELLMAPI_API_KEY) {
    providers['freellmapi'] = {
      name: 'FreeLLMAPI',
      key: envVars.FREELLMAPI_API_KEY,
      baseUrl: 'https://api.freellmapi.com/v1',
      model: 'gpt-3.5-turbo',
      rateLimit: 30,
      resetTime: 60000,
      isActive: true,
      usageCount: 0,
      lastResetTime: now,
    }
  }

  if (Object.keys(providers).length === 0) {
    throw new Error('No LLM providers configured. Set at least one API key.')
  }

  return {
    currentProvider: Object.keys(providers)[0],
    providers,
    lastRotation: now,
    rotationHistory: [
      {
        provider: Object.keys(providers)[0],
        timestamp: now,
        reason: 'initialization',
      },
    ],
  }
}

export function getCurrentProvider(state: RotationState): LLMProvider {
  const provider = state.providers[state.currentProvider]
  if (!provider) {
    throw new Error(`Provider ${state.currentProvider} not found`)
  }
  return provider
}

export function checkRateLimit(provider: LLMProvider): boolean {
  const now = Date.now()
  const timeSinceReset = now - provider.lastResetTime

  if (timeSinceReset >= provider.resetTime) {
    provider.usageCount = 0
    provider.lastResetTime = now
    provider.lastError = undefined
    provider.lastErrorTime = undefined
    return false
  }

  return provider.usageCount >= provider.rateLimit
}

export function rotateProvider(
  state: RotationState,
  reason: string = 'rate_limit_exceeded'
): boolean {
  const providerKeys = Object.keys(state.providers)
  const currentIndex = providerKeys.indexOf(state.currentProvider)

  for (let i = 1; i < providerKeys.length; i++) {
    const nextIndex = (currentIndex + i) % providerKeys.length
    const nextProvider = state.providers[providerKeys[nextIndex]]

    if (!checkRateLimit(nextProvider)) {
      state.currentProvider = providerKeys[nextIndex]
      state.lastRotation = Date.now()
      state.rotationHistory.push({
        provider: state.currentProvider,
        timestamp: Date.now(),
        reason,
      })

      console.log(
        `[AI Rotation] Switched to ${nextProvider.name} (${nextProvider.model})`
      )
      return true
    }
  }

  console.warn('[AI Rotation] All providers have hit their rate limits.')
  return false
}

export function recordUsage(state: RotationState, tokensUsed: number = 1): void {
  const provider = getCurrentProvider(state)
  provider.usageCount += tokensUsed
  provider.lastError = undefined
  provider.lastErrorTime = undefined

  console.log(
    `[AI Usage] ${provider.name}: ${provider.usageCount}/${provider.rateLimit}`
  )
}

export function recordError(
  state: RotationState,
  error: Error,
  shouldRotate: boolean = true
): boolean {
  const provider = getCurrentProvider(state)
  provider.lastError = error.message
  provider.lastErrorTime = Date.now()

  console.error(`[AI Error] ${provider.name}: ${error.message}`)

  if (shouldRotate) {
    return rotateProvider(state, `error: ${error.message.substring(0, 50)}`)
  }

  return false
}

export function getProviderStatus(
  state: RotationState
): Array<{
  name: string
  status: 'active' | 'rate_limited' | 'error' | 'inactive'
  usage: string
  model: string
  lastError?: string
}> {
  return Object.values(state.providers).map((provider) => {
    let status: 'active' | 'rate_limited' | 'error' | 'inactive' = 'active'

    if (!provider.isActive) {
      status = 'inactive'
    } else if (provider.lastError) {
      status = 'error'
    } else if (checkRateLimit(provider)) {
      status = 'rate_limited'
    }

    return {
      name: provider.name,
      status,
      usage: `${provider.usageCount}/${provider.rateLimit}`,
      model: provider.model,
      lastError: provider.lastError,
    }
  })
}

export function getRotationHistory(
  state: RotationState,
  limit: number = 10
): RotationState['rotationHistory'] {
  return state.rotationHistory.slice(-limit)
}

export function resetAllProviders(state: RotationState): void {
  const now = Date.now()

  Object.values(state.providers).forEach((provider) => {
    provider.usageCount = 0
    provider.lastResetTime = now
    provider.lastError = undefined
    provider.lastErrorTime = undefined
  })

  state.currentProvider = Object.keys(state.providers)[0]
  state.lastRotation = now

  console.log('[AI Rotation] All providers have been reset')
}

export function getProviderConfig(provider: LLMProvider): {
  baseURL: string
  apiKey: string
  headers: Record<string, string>
} {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.key}`,
  }

  if (provider.name === 'OpenRouter') {
    headers['HTTP-Referer'] = 'https://letstalkmilesandtravel.com'
    headers['X-Title'] = 'Arelys Travel Agency'
  }

  return {
    baseURL: provider.baseUrl,
    apiKey: provider.key,
    headers,
  }
}

export async function callLLMWithRotation(
  state: RotationState,
  prompt: string,
  options?: {
    maxTokens?: number
    temperature?: number
    retryCount?: number
  }
): Promise<string> {
  const maxRetries = options?.retryCount || 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const provider = getCurrentProvider(state)
    const config = getProviderConfig(provider)

    try {
      console.log(`[AI Call] Attempt ${attempt + 1}/${maxRetries} with ${provider.name}`)

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      const result = data.choices[0].message.content

      recordUsage(state, 1)
      return result
    } catch (error) {
      lastError = error as Error
      recordError(state, lastError, true)

      if (!rotateProvider(state, `call_failed_attempt_${attempt + 1}`)) {
        break
      }
    }
  }

  throw new Error(`Failed to get LLM response after ${maxRetries} attempts: ${lastError?.message}`)
}
