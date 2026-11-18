export interface LyricLine {
  time: number | null;
  text: string;
}

const LRC_TIMESTAMP_RE = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;

export function parseLyrics(raw?: string): LyricLine[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  const lines = raw.split(/\r?\n/);
  const parsed: LyricLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      parsed.push({ time: null, text: '' });
      continue;
    }

    // Skip LRC metadata headers like [ar:Artist] or [ti:Title]
    if (/^\[(ar|ti|al|by|offset|length):.*\]$/i.test(trimmed)) {
      continue;
    }

    const match = trimmed.match(LRC_TIMESTAMP_RE);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      const millis =
        fracStr.length === 1
          ? parseInt(fracStr, 10) * 100
          : fracStr.length === 2
            ? parseInt(fracStr, 10) * 10
            : parseInt(fracStr.slice(0, 3), 10);

      const time = minutes * 60 + seconds + millis / 1000;
      const text = match[4].trim();
      if (text) {
        parsed.push({ time, text });
      }
    } else {
      parsed.push({ time: null, text: trimmed });
    }
  }

  // Collapse trailing empty lines
  while (parsed.length > 0 && parsed[parsed.length - 1].text === '') {
    parsed.pop();
  }

  return parsed;
}

export function hasSyncedTimestamps(lines: LyricLine[]): boolean {
  return lines.some((line) => line.time !== null);
}

export function getActiveLyricIndex(lines: LyricLine[], currentTime: number): number {
  if (!lines.length || !hasSyncedTimestamps(lines)) {
    return -1;
  }

  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].time;
    if (t !== null && t <= currentTime + 0.15) {
      active = i;
    }
  }
  return active;
}
