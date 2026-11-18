export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseLocalFilename(fileName: string): { title: string; artist: string } {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '').trim();
  if (!withoutExt) {
    return { title: 'Untitled Audio', artist: 'Local File' };
  }

  const dashParts = withoutExt.split(/\s+[-–—]\s+/);
  if (dashParts.length >= 2) {
    const artist = dashParts[0].trim();
    const title = dashParts.slice(1).join(' - ').trim();
    if (artist && title) {
      return { artist, title };
    }
  }

  return {
    title: withoutExt.replace(/_/g, ' '),
    artist: 'Local File',
  };
}

export function upscaleItunesArtwork(url?: string, size = 600): string | undefined {
  if (!url) return undefined;
  return url.replace(/\d+x\d+bb\.(jpg|jpeg|png|webp)/i, `${size}x${size}bb.$1`);
}

export function getGreetingByHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
