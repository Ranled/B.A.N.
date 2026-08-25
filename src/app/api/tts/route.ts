import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'onyx' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Clean text for speech: remove markdown, code blocks, excessive symbols
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[*#_~>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000); // OpenAI TTS max limit

    if (!cleanText) {
      return NextResponse.json({ error: 'No speakable text' }, { status: 400 });
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: cleanText,
      speed: 1.0,
      response_format: 'mp3',
    });

    const arrayBuffer = await response.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.warn('[/api/tts] OpenAI TTS error, fallback to browser synthesis:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'TTS generation failed' },
      { status: 500 }
    );
  }
}
