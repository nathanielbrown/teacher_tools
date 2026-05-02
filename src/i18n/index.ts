// We only export the locale list and a loader function to avoid bundling all JSON files
export type Locale = 'en' | 'zh' | 'fr' | 'th' | 'vi' | 'ja';

export const loadMessages = async (locale: Locale) => {
  switch (locale) {
    case 'zh': return (await import('./zh.json')).default;
    case 'fr': return (await import('./fr.json')).default;
    case 'th': return (await import('./th.json')).default;
    case 'vi': return (await import('./vi.json')).default;
    case 'ja': return (await import('./ja.json')).default;
    default: return (await import('./en.json')).default;
  }
};

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh', 'fr', 'th', 'vi', 'ja'];
