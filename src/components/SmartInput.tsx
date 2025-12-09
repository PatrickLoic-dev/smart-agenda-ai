import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseNaturalLanguage, ParsedEvent, formatDuration, formatTime } from '@/lib/nlpParser';
import { Send, Timer, Bell, Calendar, Clock } from 'lucide-react';

interface SmartInputProps {
  onCreateEvent: (event: ParsedEvent) => void;
}

const typeIcons = {
  timer: Timer,
  alarm: Bell,
  event: Calendar,
  pomodoro: Clock,
};

const typeLabels = {
  timer: 'Timer',
  alarm: 'Alarm',
  event: 'Event',
  pomodoro: 'Pomodoro',
};

export function SmartInput({ onCreateEvent }: SmartInputProps) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedEvent | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      const parsed = parseNaturalLanguage(input);
      setPreview(parsed);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) {
      onCreateEvent(preview);
      setInput('');
      setPreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const Icon = preview ? typeIcons[preview.type] : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass-card p-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Try: "Remind me to go shopping in 2 hours"'
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
            />
            <Button
              type="submit"
              variant="glow"
              size="icon"
              disabled={!preview}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Preview */}
      {preview && (
        <div className="mt-4 slide-up">
          <div className="glass-card p-4">
            <div className="flex items-start gap-4">
              {Icon && (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {typeLabels[preview.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {preview.language.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-foreground truncate">
                  {preview.label}
                </h3>
                <div className="mt-1 text-sm text-muted-foreground">
                  {preview.duration && (
                    <span>Duration: {formatDuration(preview.duration)}</span>
                  )}
                  {preview.time && (
                    <span>Time: {formatTime(preview.time)}</span>
                  )}
                  {preview.recurring && (
                    <span className="ml-2">• {preview.recurring.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {!input && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { text: 'Remind me to go shopping in 2 hours', icon: Timer },
            { text: 'Meeting tomorrow at 2:30 PM', icon: Calendar },
            { text: 'Wake me up at 7am every weekday', icon: Bell },
            { text: 'Pomodoro for project X', icon: Clock },
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInput(suggestion.text)}
              className="glass-card p-4 text-left hover:bg-card/90 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <suggestion.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {suggestion.text}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
