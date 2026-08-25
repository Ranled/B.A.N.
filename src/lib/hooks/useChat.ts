'use client';

import { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '@/types';
import { DashboardStats } from '@/types';

export function useChat(stats?: DashboardStats | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Greetings, **Master**. I am **B.A.N.** — your Brilliant Artificial Navigator and dedicated monitoring system for CD TRACK.\n\nI stand ready to inspect and analyze your upcoming events, announcements, reminders, notes, and team profiles at your command.\n\nHow may I assist you today, Master?`,
      timestamp: new Date(),
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      abortRef.current = new AbortController();

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: content.trim() }],
          stats,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, isStreaming: true }
                    : m
                )
              );
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Mark streaming done
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: "Master, I apologize, but I encountered an error connecting to the neural interface. Please check the network connection and try again.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, stats]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `At your command, Master. How can I assist with monitoring CD TRACK today?`,
      timestamp: new Date(),
    }]);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(prev =>
      prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
    );
  }, []);

  return { messages, streaming, sendMessage, clearMessages, stopStreaming };
}
