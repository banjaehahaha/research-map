import { useEffect, useState } from 'react';

// (hover: none) and (pointer: coarse) - 표준 터치 디바이스 감지 미디어 쿼리.
// 마우스 + 터치 모두 가능한 노트북은 (hover: hover)로 잡혀서 데스크탑처럼 동작.
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';

export function useIsTouchDevice(): boolean {
  // SSR 시점엔 window가 없어 false로 초기화. 클라이언트 마운트 후 정확한 값으로 보정.
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(TOUCH_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(TOUCH_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isTouch;
}
