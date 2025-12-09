import { SmartInput } from '@/components/SmartInput';
import { TimerCard } from '@/components/TimerCard';
import { useTimers } from '@/hooks/useTimers';
import { Clock, Sparkles } from 'lucide-react';

const Index = () => {
  const { events, addEvent, pauseEvent, resumeEvent, deleteEvent, resetEvent } = useTimers();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16 fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Natural Language Timer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            <span className="gradient-text">Chrono</span>
            <span className="text-muted-foreground">Mind</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Set timers, alarms, and events using natural language. Just type what you need.
          </p>
        </header>

        {/* Smart Input */}
        <section className="mb-12">
          <SmartInput onCreateEvent={addEvent} />
        </section>

        {/* Active Timers */}
        {events.length > 0 && (
          <section className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Active</h2>
              <span className="text-sm text-muted-foreground">({events.length})</span>
            </div>
            <div className="grid gap-4">
              {events.map((event) => (
                <TimerCard
                  key={event.id}
                  event={event}
                  onPause={pauseEvent}
                  onResume={resumeEvent}
                  onDelete={deleteEvent}
                  onReset={resetEvent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-12 fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No active timers. Type something above to get started!
            </p>
          </div>
        )}

        {/* Supported Languages */}
        <footer className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-2">Supported Languages</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
            <span>🇬🇧 English</span>
            <span>🇫🇷 French</span>
            <span>🇪🇸 Spanish</span>
            <span>🇩🇪 German</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
