'use client';

import dynamic from 'next/dynamic';

// Leaflet은 SSR에서 window 객체에 의존하므로 dynamic import 필수
const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <p>Loading map...</p>
    </div>
  ),
});

export default function Map() {
  return <MapContent />;
}
