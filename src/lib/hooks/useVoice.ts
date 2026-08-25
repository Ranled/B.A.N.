'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceState } from '@/types';

// Web Speech API type augmentation
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function useVoice(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [amplitude, setAmplitude] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const transcriptRef = useRef('');

  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis?.cancel();
      cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    return (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
  }

  function startListening() {
    const SR = getSpeechRecognition();
    if (!SR) {
      alert('Voice recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    setVoiceState('listening');
    setTranscript('');
    transcriptRef.current = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0].transcript)
        .join('');
      setTranscript(current);
      transcriptRef.current = current;
    };

    recognition.onspeechend = () => {
      recognition.stop();
      const finalText = transcriptRef.current;
      if (finalText.trim()) {
        setVoiceState('thinking');
        onTranscript(finalText.trim());
      } else {
        setVoiceState('idle');
      }
    };

    recognition.onend = () => {
      // Handled by onspeechend
    };

    recognition.onerror = () => {
      setVoiceState('idle');
    };

    recognition.start();
    startMicAmplitude();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current?.abort();
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setVoiceState('idle');
    setAmplitude(0);
  }

  async function startMicAmplitude() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // Mic access denied — just ignore amplitude
    }
  }

  function speak(text: string, onEnd?: () => void) {
    window.speechSynthesis?.cancel();
    const plainText = text.replace(/[#*`_~[\]]/g, '').replace(/\n+/g, ' ');
    const utt = new SpeechSynthesisUtterance(plainText);

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')
    );
    if (preferred) utt.voice = preferred;

    utt.rate = 0.95;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    utt.onstart = () => setVoiceState('speaking');
    utt.onend = () => {
      setVoiceState('idle');
      onEnd?.();
    };
    utt.onerror = () => setVoiceState('idle');

    setVoiceState('speaking');
    window.speechSynthesis.speak(utt);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
  }

  return {
    voiceState,
    setVoiceState,
    transcript,
    amplitude,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
