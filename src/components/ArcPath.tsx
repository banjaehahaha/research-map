'use client';

import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { STYLE_CONFIG } from '@/config/mapConfig';

interface ArcPathProps {
  from: [number, number];
  to: [number, number];
  color?: string;
  opacity?: number;
}

// 두 점 사이의 위로 휘는 곡선(arc) 좌표를 생성
function generateArcPoints(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50
): [number, number][] {
  const points: [number, number][] = [];

  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  // 두 점 사이 거리에 비례하여 곡률 결정
  const distance = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  const curvature = distance * 0.15; // 거리의 15%만큼 위로 휨

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;

    // 포물선 형태로 위로 휨 (sin 곡선 활용)
    const arcOffset = Math.sin(t * Math.PI) * curvature;

    points.push([lat + arcOffset, lng]);
  }

  return points;
}

export default function ArcPath({ from, to, color, opacity }: ArcPathProps) {
  const map = useMap();

  useEffect(() => {
    const points = generateArcPoints(from, to);
    const polyline = L.polyline(points, {
      color: color || STYLE_CONFIG.arc.color,
      weight: STYLE_CONFIG.arc.weight,
      opacity: opacity ?? STYLE_CONFIG.arc.opacity,
      dashArray: STYLE_CONFIG.arc.dashArray,
      smoothFactor: 1,
    });

    polyline.addTo(map);

    return () => {
      map.removeLayer(polyline);
    };
  }, [map, from, to, color, opacity]);

  return null;
}
