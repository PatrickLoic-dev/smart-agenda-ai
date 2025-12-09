export type EventType = 'timer' | 'alarm' | 'event' | 'pomodoro';

export interface ParsedEvent {
  type: EventType;
  label: string;
  duration?: number; // in seconds
  time?: Date;
  recurring?: string[];
  language: string;
}

interface PatternMatch {
  pattern: RegExp;
  type: EventType;
  extractor: (match: RegExpMatchArray, input: string) => Partial<ParsedEvent>;
}

// Time unit mappings for different languages
const timeUnits: Record<string, Record<string, number>> = {
  en: { second: 1, seconds: 1, sec: 1, s: 1, minute: 60, minutes: 60, min: 60, m: 60, hour: 3600, hours: 3600, h: 3600 },
  fr: { seconde: 1, secondes: 1, sec: 1, s: 1, minute: 60, minutes: 60, min: 60, m: 60, heure: 3600, heures: 3600, h: 3600 },
  es: { segundo: 1, segundos: 1, seg: 1, s: 1, minuto: 60, minutos: 60, min: 60, m: 60, hora: 3600, horas: 3600, h: 3600 },
  de: { sekunde: 1, sekunden: 1, sek: 1, s: 1, minute: 60, minuten: 60, min: 60, m: 60, stunde: 3600, stunden: 3600, h: 3600 },
};

// Day mappings
const dayMappings: Record<string, Record<string, string>> = {
  en: { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun', weekday: 'Mon-Fri', weekdays: 'Mon-Fri', everyday: 'Mon-Sun', daily: 'Mon-Sun' },
  fr: { lundi: 'Mon', mardi: 'Tue', mercredi: 'Wed', jeudi: 'Thu', vendredi: 'Fri', samedi: 'Sat', dimanche: 'Sun', semaine: 'Mon-Fri' },
  es: { lunes: 'Mon', martes: 'Tue', miércoles: 'Wed', jueves: 'Thu', viernes: 'Fri', sábado: 'Sat', domingo: 'Sun' },
  de: { montag: 'Mon', dienstag: 'Tue', mittwoch: 'Wed', donnerstag: 'Thu', freitag: 'Fri', samstag: 'Sat', sonntag: 'Sun', werktags: 'Mon-Fri' },
};

// Detect language from input
function detectLanguage(input: string): string {
  const lowerInput = input.toLowerCase();
  
  // French indicators
  if (/\b(rappelle|dans|heure|heures|minute|minutes|demain|réunion|réveil)\b/i.test(lowerInput)) return 'fr';
  
  // Spanish indicators
  if (/\b(recuérdame|en|hora|horas|minuto|minutos|mañana|reunión|despierta)\b/i.test(lowerInput)) return 'es';
  
  // German indicators
  if (/\b(erinnere|in|stunde|stunden|minute|minuten|morgen|weck|besprechung)\b/i.test(lowerInput)) return 'de';
  
  // Default to English
  return 'en';
}

// Parse time expressions like "2 hours", "30 minutes", etc.
function parseDuration(input: string, lang: string): number | null {
  const units = { ...timeUnits.en, ...timeUnits[lang] };
  
  // Match patterns like "2 hours", "30 min", "1h 30m"
  const patterns = [
    /(\d+)\s*(hours?|h|heures?|stunden?|horas?)\s*(?:and\s*)?(\d+)?\s*(minutes?|min|m)?/i,
    /(\d+)\s*(minutes?|min|m|minuten?|minutos?)/i,
    /(\d+)\s*(seconds?|sec|s|sekunden?|segundos?)/i,
    /(\d+)\s*(hours?|h|heures?|stunden?|horas?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let seconds = 0;
      const value1 = parseInt(match[1]);
      const unit1 = match[2]?.toLowerCase();
      
      if (unit1 && units[unit1]) {
        seconds += value1 * units[unit1];
      }
      
      if (match[3] && match[4]) {
        const value2 = parseInt(match[3]);
        const unit2 = match[4].toLowerCase();
        if (units[unit2]) {
          seconds += value2 * units[unit2];
        }
      }
      
      return seconds > 0 ? seconds : null;
    }
  }
  
  return null;
}

// Parse time of day like "7am", "14:30", "2:30 PM"
function parseTimeOfDay(input: string): Date | null {
  const now = new Date();
  
  // Match patterns like "7am", "7:30am", "14:30", "2:30 PM"
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2})h(\d{2})?/i,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const period = match[3]?.toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      
      // If time is in the past, assume tomorrow
      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }
      
      return result;
    }
  }
  
  return null;
}

// Parse relative dates like "tomorrow", "in 2 days"
function parseRelativeDate(input: string, lang: string): Date | null {
  const lowerInput = input.toLowerCase();
  const now = new Date();
  
  const tomorrowPatterns: Record<string, RegExp> = {
    en: /\btomorrow\b/i,
    fr: /\bdemain\b/i,
    es: /\bmañana\b/i,
    de: /\bmorgen\b/i,
  };
  
  if (tomorrowPatterns[lang]?.test(lowerInput) || tomorrowPatterns.en.test(lowerInput)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  return null;
}

// Extract label from input
function extractLabel(input: string, patterns: RegExp[]): string {
  let label = input;
  
  // Remove common prefixes
  const prefixes = [
    /^(remind\s+me\s+to|rappelle[-\s]moi\s+de|recuérdame\s+que|erinnere\s+mich\s+an)\s*/i,
    /^(set\s+a?\s*(timer|alarm)\s+(for|to))\s*/i,
    /^(wake\s+me\s+up\s+at)\s*/i,
    /^(meeting|réunion|reunión|besprechung)\s*/i,
  ];
  
  for (const prefix of prefixes) {
    label = label.replace(prefix, '');
  }
  
  // Remove time expressions
  const timePatterns = [
    /\b(in\s+)?\d+\s*(hours?|h|minutes?|min|m|seconds?|sec|s|heures?|stunden?|horas?|minuten?|minutos?)\b/gi,
    /\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi,
    /\b(tomorrow|demain|mañana|morgen)\b/gi,
    /\bevery\s+(weekday|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  ];
  
  for (const pattern of timePatterns) {
    label = label.replace(pattern, '');
  }
  
  // Clean up
  label = label.replace(/\s+/g, ' ').trim();
  label = label.replace(/^(to|for|de|que|an)\s+/i, '');
  
  return label || 'New Event';
}

// Parse recurring patterns
function parseRecurring(input: string, lang: string): string[] | undefined {
  const lowerInput = input.toLowerCase();
  const days = { ...dayMappings.en, ...dayMappings[lang] };
  
  // Check for "every weekday", "every day", etc.
  const everyPattern = /every\s+(\w+)/i;
  const match = lowerInput.match(everyPattern);
  
  if (match) {
    const dayStr = match[1].toLowerCase();
    if (days[dayStr]) {
      const result = days[dayStr];
      if (result.includes('-')) {
        // Expand ranges like Mon-Fri
        const [start, end] = result.split('-');
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const startIdx = allDays.indexOf(start);
        const endIdx = allDays.indexOf(end);
        return allDays.slice(startIdx, endIdx + 1);
      }
      return [result];
    }
  }
  
  return undefined;
}

export function parseNaturalLanguage(input: string): ParsedEvent | null {
  if (!input.trim()) return null;
  
  const language = detectLanguage(input);
  const lowerInput = input.toLowerCase();
  
  // Pomodoro detection
  if (/\bpomodoro\b/i.test(lowerInput)) {
    const label = extractLabel(input, [/pomodoro\s*(for|pour|para|für)?/i]);
    return {
      type: 'pomodoro',
      label: label || 'Focus Session',
      duration: 25 * 60, // 25 minutes
      language,
    };
  }
  
  // Alarm detection (wake me up, alarm at...)
  if (/\b(wake|alarm|réveil|weck|despierta)\b/i.test(lowerInput)) {
    const time = parseTimeOfDay(input);
    const recurring = parseRecurring(input, language);
    
    return {
      type: 'alarm',
      label: extractLabel(input, []),
      time: time || undefined,
      recurring,
      language,
    };
  }
  
  // Timer detection (remind me in X, set timer for X)
  const duration = parseDuration(input, language);
  if (duration) {
    return {
      type: 'timer',
      label: extractLabel(input, []),
      duration,
      language,
    };
  }
  
  // Event detection (meeting at, event at)
  const time = parseTimeOfDay(input);
  const relativeDate = parseRelativeDate(input, language);
  
  if (time || relativeDate) {
    const eventTime = time || new Date();
    if (relativeDate && time) {
      eventTime.setFullYear(relativeDate.getFullYear());
      eventTime.setMonth(relativeDate.getMonth());
      eventTime.setDate(relativeDate.getDate());
    }
    
    return {
      type: 'event',
      label: extractLabel(input, []),
      time: eventTime,
      language,
    };
  }
  
  // Default: treat as a quick timer (5 minutes)
  return {
    type: 'timer',
    label: input.trim() || 'Quick Timer',
    duration: 5 * 60,
    language,
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
