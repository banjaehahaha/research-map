'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useState, useEffect, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

import { MAP_CONFIG, STYLE_CONFIG } from '@/config/mapConfig';
import { SpotData } from '@/lib/types';
import { sampleData } from '@/lib/sampleData';
import { groupByResearch } from '@/lib/groupData';
import { fetchSheetData } from '@/lib/fetchSheetData';
import ArcPath from './ArcPath';
import HoverTooltip from './HoverTooltip';
import Modal from './Modal';
import ResearchLegend from './ResearchLegend';
import { useIsTouchDevice } from '@/lib/useIsTouchDevice';
// 서울 기점 마커는 제거되었지만, MAP_CONFIG.seoul은 초기 지도 중심 등 다른 곳에서 참조될 수 있음

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL || '';

const DIM_OPACITY = 0.12;

export default function MapContent() {
  const [spots, setSpots] = useState<SpotData[]>(sampleData);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);
  const [hoveredSpot, setHoveredSpot] = useState<SpotData | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTouch = useIsTouchDevice();
  // 터치 디바이스에서는 마커가 작으면 탭이 어려우므로 반지름을 키움
  const markerRadius = isTouch ? 11 : STYLE_CONFIG.marker.radius;

  useEffect(() => {
    if (!SHEET_CSV_URL) return;

    setLoading(true);
    fetchSheetData(SHEET_CSV_URL)
      .then((data) => {
        if (data.length > 0) setSpots(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch sheet data:', err);
        setError('데이터를 불러오지 못했습니다. 샘플 데이터를 표시합니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSpotOver = useCallback((spot: SpotData) => {
    setHoveredSpot(spot);
    setHoveredGroupId(spot.research_id);
  }, []);

  const handleSpotOut = useCallback(() => {
    setHoveredSpot(null);
    setHoveredGroupId(null);
  }, []);

  const handleLegendOver = useCallback((researchId: string) => {
    setHoveredGroupId(researchId);
  }, []);

  const handleLegendOut = useCallback(() => {
    setHoveredGroupId(null);
  }, []);

  // 터치: 같은 항목을 다시 탭하면 dim 해제
  const handleLegendToggle = useCallback((researchId: string) => {
    setHoveredGroupId((curr) => (curr === researchId ? null : researchId));
  }, []);

  const researchGroups = groupByResearch(spots);

  return (
    <>
      {loading && (
        <div className="data-status data-loading">Loading data...</div>
      )}
      {error && <div className="data-status data-error">{error}</div>}

      <ResearchLegend
        groups={researchGroups}
        hoveredGroupId={hoveredGroupId}
        onHover={handleLegendOver}
        onOut={handleLegendOut}
        onToggle={handleLegendToggle}
        isTouch={isTouch}
      />

      <MapContainer
        center={[MAP_CONFIG.initialCenter.lat, MAP_CONFIG.initialCenter.lng]}
        zoom={MAP_CONFIG.initialZoom}
        className="map-container"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url={MAP_CONFIG.tileUrl}
          attribution={MAP_CONFIG.tileAttribution}
        />

        {/* 각 리서치 그룹별 곡선 + 마커 - 첫 번째 스팟이 시작점 */}
        {researchGroups.map((group) => {
          const groupSpots = group.spots;
          const arcs: { from: [number, number]; to: [number, number] }[] = [];

          // 같은 research_id 내에서 spot_order 순으로 연결
          for (let i = 0; i < groupSpots.length - 1; i++) {
            arcs.push({
              from: [groupSpots[i].lat, groupSpots[i].lng],
              to: [groupSpots[i + 1].lat, groupSpots[i + 1].lng],
            });
          }

          const groupColor = group.color || STYLE_CONFIG.marker.fillColor;
          const isDimmed =
            hoveredGroupId !== null && hoveredGroupId !== group.research_id;

          const arcOpacity = isDimmed ? DIM_OPACITY : STYLE_CONFIG.arc.opacity;
          const markerFillOpacity = isDimmed
            ? DIM_OPACITY
            : STYLE_CONFIG.marker.fillOpacity;
          const markerStrokeOpacity = isDimmed ? DIM_OPACITY : 1;

          return (
            <span key={group.research_id}>
              {arcs.map((arc, i) => (
                <ArcPath
                  key={`arc-${group.research_id}-${i}`}
                  from={arc.from}
                  to={arc.to}
                  color={groupColor}
                  opacity={arcOpacity}
                />
              ))}

              {groupSpots.map((spot) => (
                <CircleMarker
                  key={`spot-${spot.research_id}-${spot.spot_order}`}
                  center={[spot.lat, spot.lng]}
                  radius={markerRadius}
                  pathOptions={{
                    fillColor: groupColor,
                    fillOpacity: markerFillOpacity,
                    color: STYLE_CONFIG.marker.strokeColor,
                    weight: STYLE_CONFIG.marker.strokeWeight,
                    opacity: markerStrokeOpacity,
                  }}
                  eventHandlers={
                    isTouch
                      ? {
                          // 터치: 호버 이벤트 바인딩 안 함 (탭 즉시 모달 열림)
                          click: () => setSelectedSpot(spot),
                        }
                      : {
                          click: () => setSelectedSpot(spot),
                          mouseover: () => handleSpotOver(spot),
                          mouseout: handleSpotOut,
                        }
                  }
                >
                  <Tooltip direction="right" offset={[10, 0]} opacity={0.9}>
                    <span className="spot-label">{spot.spot_name}</span>
                  </Tooltip>
                </CircleMarker>
              ))}
            </span>
          );
        })}

        {/* 호버 섬네일 - 터치 디바이스에서는 표시 안 함 */}
        {!isTouch && hoveredSpot && <HoverTooltip spot={hoveredSpot} />}
      </MapContainer>

      {/* 모달 */}
      {selectedSpot && (
        <Modal spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
      )}
    </>
  );
}
