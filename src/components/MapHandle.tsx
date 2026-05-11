'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// MapContainer 내부에서만 useMap()을 쓸 수 있으므로 작은 헬퍼로 인스턴스를 외부에 노출.
// 부모는 onReady로 Leaflet map 인스턴스를 받아 ref에 저장한다.
export default function MapHandle({
  onReady,
}: {
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}
