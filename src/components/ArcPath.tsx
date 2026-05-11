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
  // 같은 두 위치를 잇는 line이 여러 개일 때 평행 효과를 위한 곡률 보정.
  // 0이면 기존 곡선, 양수면 더 봉긋, 음수면 더 평평.
  curveBoost?: number;
  // 세계 지도 wrap을 위한 경도 오프셋
  lngOffset?: number;
}

function generateArcPoints(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50,
  curveBoost: number = 0
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const distance = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  // 기본 곡률 15%, curveBoost로 조정. (-0.6 ~ +0.6 사이가 자연스러움)
  const curvature = distance * 0.15 * (1 + curveBoost);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    const arcOffset = Math.sin(t * Math.PI) * curvature;
    points.push([lat + arcOffset, lng]);
  }

  return points;
}

export default function ArcPath({
  from,
  to,
  color,
  opacity,
  curveBoost = 0,
  lngOffset = 0,
}: ArcPathProps) {
  const map = useMap();

  useEffect(() => {
    const adjFrom: [number, number] = [from[0], from[1] + lngOffset];
    const adjTo: [number, number] = [to[0], to[1] + lngOffset];
    const points = generateArcPoints(adjFrom, adjTo, 50, curveBoost);
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
  }, [map, from, to, color, opacity, curveBoost, lngOffset]);

  return null;
}
