export const MAP_CONFIG = {
  // 서울 좌표 (기점)
  seoul: {
    lat: 37.5665,
    lng: 126.978,
  },

  // 초기 뷰 - 세계 전체가 보이되 서울이 중심에서 살짝 왼쪽
  initialCenter: {
    lat: 30,
    lng: 145,
  },
  initialZoom: 3,

  // 타일 레이어
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// 디자인 변수 - 쉽게 커스텀 가능
export const STYLE_CONFIG = {
  // 곡선 경로
  arc: {
    color: '#2563eb',
    weight: 2,
    opacity: 1,
    dashArray: '8, 4',
  },

  // 마커
  marker: {
    radius: 6,
    fillColor: '#2563eb',
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  },

  // 서울 기점 마커
  seoulMarker: {
    radius: 8,
    fillColor: '#dc2626',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  },
};
