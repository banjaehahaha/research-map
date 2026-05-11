import { Language } from './types';

// 한국어 필드가 비어있으면 영문 폴백
export function pick(en: string, kr: string, lang: Language): string {
  if (lang === 'kr') return kr || en;
  return en || kr;
}
