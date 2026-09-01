/**
 * AI Agent Provider Singleton
 * Manages the rotation state across the entire application
 */

import { initializeAIRotation, type RotationState } from './ai-rotation'

let rotationState: RotationState | null = null

/**
 * Get or initialize the AI rotation state
 * This is called once on startup and reused throughout the app lifetime
 */
export function getAIRotationState(): RotationState {
  if (!rotationState) {
    const env = process.env
    try {
      rotationState = initializeAIRotation({
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || '',
        OMNIROUTE_API_KEY: env.OMNIROUTE_API_KEY || '',
        OMNIROUTE_BASE_URL: env.OMNIROUTE_BASE_URL || '',
        OPENAI_API_KEY: env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || '',
        FREELLMAPI_API_KEY: env.FREELLMAPI_API_KEY || '',
        '21ST_DEV_KEY': env['21ST_DEV_KEY'] || '',
      })
      console.log('[AI Provider] Rotation system initialized')
    } catch (error) {
      console.error('[AI Provider] Failed to initialize:', error)
      throw error
    }
  }
  return rotationState
}

/**
 * Reset the rotation state (useful for testing)
 */
export function resetAIRotationState(): void {
  rotationState = null
}
