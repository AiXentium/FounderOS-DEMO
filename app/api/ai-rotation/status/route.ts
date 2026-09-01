import { NextResponse } from 'next/server'
import { getProviderStatus, getRotationHistory, getCurrentProvider } from '@/lib/ai-rotation'
import { getAIRotationState } from '@/lib/ai-agent-provider'

export async function GET() {
  try {
    const state = getAIRotationState()
    const currentProvider = getCurrentProvider(state)

    return NextResponse.json({
      success: true,
      currentProvider: {
        name: currentProvider.name,
        model: currentProvider.model,
      },
      providers: getProviderStatus(state),
      lastRotation: new Date(state.lastRotation).toISOString(),
      rotationHistory: getRotationHistory(state, 20).map((entry) => ({
        provider: entry.provider,
        timestamp: new Date(entry.timestamp).toISOString(),
        reason: entry.reason,
      })),
    })
  } catch (error) {
    console.error('[AI Rotation API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
