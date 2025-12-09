import { useState, useEffect, useCallback } from 'react';
import { ParsedEvent } from '@/lib/nlpParser';
import { ActiveEvent } from '@/components/TimerCard';

export function useTimers() {
  const [events, setEvents] = useState<ActiveEvent[]>([]);

  const addEvent = useCallback((parsed: ParsedEvent) => {
    const newEvent: ActiveEvent = {
      ...parsed,
      id: crypto.randomUUID(),
      startTime: Date.now(),
      remainingSeconds: parsed.duration || 0,
      isPaused: false,
      isComplete: false,
    };
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const pauseEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPaused: true } : e))
    );
  }, []);

  const resumeEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPaused: false } : e))
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const resetEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              remainingSeconds: e.duration || 0,
              isPaused: false,
              isComplete: false,
              startTime: Date.now(),
            }
          : e
      )
    );
  }, []);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) =>
        prev.map((event) => {
          if (event.isPaused || event.isComplete) return event;
          if (event.type !== 'timer' && event.type !== 'pomodoro') return event;

          const newRemaining = Math.max(0, event.remainingSeconds - 1);
          const isComplete = newRemaining === 0;

          if (isComplete && !event.isComplete) {
            // Play notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${event.label} is complete!`, {
                body: `Your ${event.type} has finished.`,
                icon: '/favicon.ico',
              });
            }
          }

          return {
            ...event,
            remainingSeconds: newRemaining,
            isComplete,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    events,
    addEvent,
    pauseEvent,
    resumeEvent,
    deleteEvent,
    resetEvent,
  };
}
