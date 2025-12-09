import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ParsedEvent, formatTime } from '@/lib/nlpParser';
import { Timer, Bell, Calendar, Clock, Play, Pause, X, RotateCcw } from 'lucide-react';

interface ActiveEvent extends ParsedEvent {
  id: string;
  startTime: number;
  remainingSeconds: number;
  isPaused: boolean;
  isComplete: boolean;
}

interface TimerCardProps {
  event: ActiveEvent;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}

const typeIcons = {
  timer: Timer,
  alarm: Bell,
  event: Calendar,
  pomodoro: Clock,
};

const typeColors = {
  timer: 'text-primary',
  alarm: 'text-amber-400',
  event: 'text-emerald-400',
  pomodoro: 'text-rose-400',
};

export function TimerCard({ event, onPause, onResume, onDelete, onReset }: TimerCardProps) {
  const Icon = typeIcons[event.type];
  const colorClass = typeColors[event.type];

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = event.duration 
    ? ((event.duration - event.remainingSeconds) / event.duration) * 100 
    : 0;

  return (
    <div 
      className={`glass-card p-6 fade-in ${event.isComplete ? 'ring-2 ring-primary amber-glow' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{event.label}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {event.type}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(event.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Timer Display */}
      {event.type === 'timer' || event.type === 'pomodoro' ? (
        <div className="text-center py-4">
          <div className={`timer-display ${event.isComplete ? 'gradient-text' : ''}`}>
            {formatCountdown(event.remainingSeconds)}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {!event.isComplete && (
              <>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => event.isPaused ? onResume(event.id) : onPause(event.id)}
                >
                  {event.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => onReset(event.id)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
            {event.isComplete && (
              <Button variant="glow" onClick={() => onReset(event.id)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-3xl font-mono font-medium text-foreground">
            {event.time && formatTime(event.time)}
          </div>
          {event.recurring && (
            <div className="mt-2 text-sm text-muted-foreground">
              {event.recurring.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { ActiveEvent };
