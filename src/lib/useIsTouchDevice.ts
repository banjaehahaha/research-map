import { useEffect, useState } from 'react';

// (hover: none) and (pointer: coarse) - 표준 터치 디바이스 감지 미디어 쿼리.
// 마우스 + 터치 모두 가능한 노트북은 (hover: hover)로 잡혀서 데스크탑처럼 동작.
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(TOUCH_QUERY);
    setIsTouch(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isTouch;
}
