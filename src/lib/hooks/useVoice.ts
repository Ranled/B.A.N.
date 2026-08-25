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
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export type OpenAIVoice = 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer';

/**
 * Prepares conversational text for speech synthesis so it sounds natural,
 * stripping markdown, code blocks, URLs, and formatting abbreviations.
 */
export function cleanSpokenText(raw: string): string {
  if (!raw) return '';

  return raw
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links but keep text [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, 'link')
    // Remove markdown headers, bold, italics, strikethrough, blockquotes
    .replace(/[#*`_~>|]/g, ' ')
    // Convert bullets to natural pauses
    .replace(/^[\s-•*]+/gm, '')
    // Expand common acronyms & tech terms for natural phonetic pronunciation
    .replace(/\bCD TRACK\b/gi, 'C D Track')
    .replace(/\bB\.A\.N\.\b/gi, 'Ban')
    .replace(/\bBAN\b/g, 'Ban')
    .replace(/\bRLS\b/g, 'R L S')
    .replace(/\be\.g\.\b/gi, 'for example')
    .replace(/\bi\.e\.\b/gi, 'that is')
    .replace(/\betc\.\b/gi, 'and so forth')
    .replace(/\bID\b/g, 'I D')
    .replace(/\bIDs\b/g, 'I Ds')
    .replace(/\bvs\b/gi, 'versus')
    .replace(/\b&\b/g, 'and')
    .replace(/[%]/g, ' percent ')
    // Normalize punctuation & spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function useVoice(onTranscript?: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [amplitude, setAmplitude] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<OpenAIVoice>('onyx');
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const transcriptRef = useRef('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);
  const browserVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load and cache browser voices
  useEffect(() => {
    function loadVoices() {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          browserVoicesRef.current = voices;
          setVoicesLoaded(true);
        }
      }
    }

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    return (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
  }

  // Real-time microphone audio amplitude analyzer
  async function startMicStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(Math.min(avg / 70, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // AudioContext mic permissions denied or unavailable
    }
  }

  function stopMicStream() {
    cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAmplitude(0);
  }

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    stopMicStream();
    setVoiceState('idle');
  }, []);

  const startListening = useCallback(() => {
    stopSpeaking();
    const SR = getSpeechRecognition();
    if (!SR) {
      alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SR();
      recognitionRef.current = recognition;
      isListeningRef.current = true;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setVoiceState('listening');
      setTranscript('');
      transcriptRef.current = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          setTranscript(currentText);
          transcriptRef.current = currentText;
        }

        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (transcriptRef.current.trim() && isListeningRef.current) {
            finishListening();
          }
        }, 1600);
      };

      function finishListening() {
        if (!isListeningRef.current) return;
        isListeningRef.current = false;
        recognition.stop();
        stopMicStream();

        const finalText = transcriptRef.current.trim();
        if (finalText) {
          setVoiceState('thinking');
          onTranscript?.(finalText);
        } else {
          setVoiceState('idle');
        }
      }

      recognition.onspeechend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(finishListening, 400);
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
        stopListening();
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          finishListening();
        }
      };

      recognition.start();
      startMicStream();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      stopListening();
    }
  }, [onTranscript, stopListening]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    cancelAnimationFrame(animFrameRef.current);
    setVoiceState('idle');
    setAmplitude(0);
  }, []);

  // Web Speech API Fallback with natural human voice selection & sentence splitting
  const speakWithBrowser = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanSpokenText(text);
    if (!clean) {
      onEnd?.();
      return;
    }

    const utt = new SpeechSynthesisUtterance(clean);
    const voices = browserVoicesRef.current.length > 0
      ? browserVoicesRef.current
      : window.speechSynthesis.getVoices();

    // Priority ranking for natural, expressive voices across operating systems
    const preferredVoice = voices.find(v =>
      v.name.includes('Natural') ||
      v.name.includes('Online (Natural)') ||
      v.name.includes('Neural') ||
      v.name.includes('Christopher') ||
      v.name.includes('Jenny') ||
      v.name.includes('Guy') ||
      v.name.includes('Daniel') ||
      v.name.includes('Google UK English Male') ||
      v.name.includes('Google US English') ||
      v.name.includes('Samantha')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utt.voice = preferredVoice;
    }

    utt.rate = 1.0;
    utt.pitch = 0.98; // Slightly lower pitch gives an executive, confident feel
    utt.volume = 1.0;

    // Simulate animated speech amplitude waveform during browser TTS
    let ampTimer: number;
    function simulateVoiceWaveform() {
      const randomAmp = 0.2 + Math.random() * 0.7;
      setAmplitude(randomAmp);
      ampTimer = window.setTimeout(simulateVoiceWaveform, 90);
    }

    utt.onstart = () => {
      setVoiceState('speaking');
      simulateVoiceWaveform();
    };

    utt.onend = () => {
      clearTimeout(ampTimer);
      setVoiceState('idle');
      setAmplitude(0);
      onEnd?.();
    };

    utt.onerror = () => {
      clearTimeout(ampTimer);
      setVoiceState('idle');
      setAmplitude(0);
      onEnd?.();
    };

    // Chrome bugfix: resume speech synthesis if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    setVoiceState('speaking');
    window.speechSynthesis.speak(utt);
  }, []);

  /**
   * Speaks text using OpenAI Neural Studio TTS, with seamless fallback to Browser Natural TTS.
   */
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    stopSpeaking();
    const clean = cleanSpokenText(text);
    if (!clean) {
      onEnd?.();
      return;
    }

    setVoiceState('speaking');

    try {
      // Attempt ultra-realistic OpenAI Neural TTS
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: selectedVoice }),
      });

      if (!res.ok) {
        throw new Error('OpenAI TTS unavailable');
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Connect HTMLAudio to Web Audio API for real-time waveform visualization
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        const data = new Uint8Array(analyser.frequencyBinCount);
        function trackAudio() {
          if (!analyser) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAmplitude(Math.min(avg / 60, 1));
          animFrameRef.current = requestAnimationFrame(trackAudio);
        }
        trackAudio();
      } catch {
        // Direct playback without WebAudio graph if CORS/AudioContext restricted
      }

      audio.onended = () => {
        cancelAnimationFrame(animFrameRef.current);
        setVoiceState('idle');
        setAmplitude(0);
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = () => {
        // Fallback to browser synthesis on audio playback error
        speakWithBrowser(text, onEnd);
      };

      await audio.play();
    } catch {
      // Fallback directly to high-quality browser Web Speech API
      speakWithBrowser(text, onEnd);
    }
  }, [selectedVoice, speakWithBrowser, stopSpeaking]);

  return {
    voiceState,
    setVoiceState,
    transcript,
    amplitude,
    selectedVoice,
    setSelectedVoice,
    voicesLoaded,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    speakWithBrowser,
  };
}
