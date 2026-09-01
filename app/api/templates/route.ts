import { NextResponse } from 'next/server';
import { TEMPLATE_VAULT } from '@/lib/template-vault';

export async function GET() { return NextResponse.json({ templates: TEMPLATE_VAULT, capabilities: { uiUxProMax: 'design rules and style catalog integrated', framerMotion: 'animation recipes ready; package optional', magicComponents: 'component recipes ready; external catalog optional' } }); }
