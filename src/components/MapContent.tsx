'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type L from 'leaflet';

import { MAP_CONFIG, STYLE_CONFIG } from '@/config/mapConfig';
import {
  ResearchSpot,
  WorkSpot,
  NowSpot,
  AnySpot,
  SheetData,
  ProjectGroup,
  TabId,
} from '@/lib/types';
import { fetchAllSheets } from '@/lib/fetchSheetData';
import { getVisibleProjectSpots } from '@/lib/visibleSpots';
import { parseColors } from '@/lib/groupData';
import { findStackedSpots } from '@/lib/stackSpots';
import ArcPath from './ArcPath';
import HoverTooltip from './HoverTooltip';
import Modal, { ModalContent } from './Modal';
import SidePanel from './SidePanel';
import StackedDot from './StackedDot';
import MapHandle from './MapHandle';
import { useIsTouchDevice } from '@/lib/useIsTouchDevice';

const DIM_OPACITY = 0.12;
const ARC_BASE_OPACITY = 0.3;

const FLY_DURATION = 0.8; // 초
const FLY_TIMEOUT_MS = 900;
const FLY_ZOOM = 8;

// 세계 지도 가로 반복(wrap) — 마커/궤적을 좌·중·우 3번 그려서 가장자리에서도 끊기지 않게
const WORLD_COPIES = [-360, 0, 360] as const;

const EMPTY_DATA: SheetData = {
  research: [],
  works: [],
  now: [],
  projects: [],
};

// 좌표 동등 비교용 키 (4자리 정밀도 ~ 약 11m)
function locKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// edge 키 (방향 무관 정규화)
function edgeKey(a: [number, number], b: [number, number]): string {
  const k1 = locKey(a[0], a[1]);
  const k2 = locKey(b[0], b[1]);
  return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
}

interface ArcEntry {
  from: [number, number];
  to: [number, number];
  color: string;
  research_id: string;
}

export default function MapContent() {
  const [data, setData] = useState<SheetData>(EMPTY_DATA);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [hoveredSpot, setHoveredSpot] = useState<ResearchSpot | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLayers, setActiveLayers] = useState<Record<TabId, boolean>>({
    research: true,
    works: false,
    now: false,
  });

  const isTouch = useIsTouchDevice();
  const baseMarkerRadius = isTouch ? 11 : 8;

  const mapRef = useRef<L.Map | null>(null);
  const handleMapReady = useCallback((m: L.Map) => {
    mapRef.current = m;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllSheets()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch sheet data:', err);
        setError('데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLayerToggle = useCallback((layer: TabId) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const openSpot = useCallback(
    (spot: AnySpot) => {
      const stacked = findStackedSpots(spot, data, activeLayers);
      if (stacked.length <= 1) {
        setModalContent({
          kind: 'detail',
          spot: spot as ResearchSpot | WorkSpot | NowSpot,
        });
      } else {
        setModalContent({ kind: 'stack', spots: stacked });
      }
    },
    [data, activeLayers]
  );

  const handleStackSelect = useCallback((spot: AnySpot) => {
    setModalContent({
      kind: 'detail',
      spot: spot as ResearchSpot | WorkSpot | NowSpot,
    });
  }, []);

  const handleSpotOver = useCallback(
    (spots: (ResearchSpot | WorkSpot)[]) => {
      const research = spots.find((s) => s.kind === 'research') as
        | ResearchSpot
        | undefined;
      if (research) setHoveredSpot(research);
      // 첫 spot의 research_id로 dim 그룹 결정
      setHoveredGroupId(spots[0]?.research_id ?? null);
    },
    []
  );

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

  const handleLegendToggle = useCallback((researchId: string) => {
    setHoveredGroupId((curr) => (curr === researchId ? null : researchId));
  }, []);

  const handleRelatedWork = useCallback(
    (workId: string) => {
      const w = data.works.find((x) => x.work_id === workId);
      if (!w) return;
      setActiveLayers((prev) => ({ ...prev, works: true }));
      setModalContent(null);
      mapRef.current?.flyTo([w.lat, w.lng], FLY_ZOOM, {
        duration: FLY_DURATION,
      });
      window.setTimeout(() => {
        setModalContent({ kind: 'detail', spot: w });
      }, FLY_TIMEOUT_MS);
    },
    [data.works]
  );

  const handleRelatedResearch = useCallback(
    (researchId: string) => {
      const r = data.research.find((x) => x.research_id === researchId);
      if (!r) return;
      setActiveLayers((prev) => ({ ...prev, research: true }));
      setModalContent(null);
      mapRef.current?.flyTo([r.lat, r.lng], FLY_ZOOM, {
        duration: FLY_DURATION,
      });
      window.setTimeout(() => {
        setModalContent({ kind: 'detail', spot: r });
      }, FLY_TIMEOUT_MS);
    },
    [data.research]
  );

  const projects: ProjectGroup[] = data.projects;
  const visibleLayerCount =
    Number(activeLayers.research) +
    Number(activeLayers.works) +
    Number(activeLayers.now);
  const isMultiLayer = visibleLayerCount > 1;
  const showProjectLayer = activeLayers.research || activeLayers.works;

  // 모든 visible Research/Work spot을 좌표별로 그룹화 (다중 외곽선용)
  const dotGroups = useMemo(() => {
    const map = new Map<string, (ResearchSpot | WorkSpot)[]>();
    if (activeLayers.research) {
      for (const r of data.research) {
        const k = locKey(r.lat, r.lng);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(r);
      }
    }
    if (activeLayers.works) {
      for (const w of data.works) {
        const k = locKey(w.lat, w.lng);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(w);
      }
    }
    return Array.from(map.entries()).map(([key, spots]) => ({ key, spots }));
  }, [data.research, data.works, activeLayers]);

  // 모든 visible 궤적선을 edge별로 그룹화 (다중 line 평행 처리용)
  const arcsByEdge = useMemo(() => {
    const map = new Map<string, ArcEntry[]>();
    for (const group of projects) {
      const visibleSpots = getVisibleProjectSpots(group, activeLayers);
      for (let i = 0; i < visibleSpots.length - 1; i++) {
        const a = visibleSpots[i];
        const b = visibleSpots[i + 1];
        // 같은 위치끼리는 line 그릴 의미 없음
        if (locKey(a.lat, a.lng) === locKey(b.lat, b.lng)) continue;
        const arc: ArcEntry = {
          from: [a.lat, a.lng],
          to: [b.lat, b.lng],
          color: group.primary_color,
          research_id: group.research_id,
        };
        const k = edgeKey(arc.from, arc.to);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(arc);
      }
    }
    return map;
  }, [projects, activeLayers]);

  return (
    <>
      {loading && (
        <div className="data-status data-loading">Loading data...</div>
      )}
      {error && <div className="data-status data-error">{error}</div>}

      <SidePanel
        groups={projects}
        hoveredGroupId={hoveredGroupId}
        onHover={handleLegendOver}
        onOut={handleLegendOut}
        onToggle={handleLegendToggle}
        isTouch={isTouch}
        activeLayers={activeLayers}
        onLayerToggle={handleLayerToggle}
      />

      <MapContainer
        center={[MAP_CONFIG.initialCenter.lat, MAP_CONFIG.initialCenter.lng]}
        zoom={MAP_CONFIG.initialZoom}
        className="map-container"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapHandle onReady={handleMapReady} />
        <TileLayer
          url={MAP_CONFIG.tileUrl}
          attribution={MAP_CONFIG.tileAttribution}
        />

        {/* 세계 지도 wrap: 좌(-360) / 중(0) / 우(+360) 세 번 그림 */}
        {WORLD_COPIES.map((wrapOffset) => (
          <span key={`world-${wrapOffset}`}>
            {/* 궤적선: 같은 edge가 여러 프로젝트면 곡률을 다르게 줘서 평행 효과 */}
            {showProjectLayer &&
              Array.from(arcsByEdge.entries()).flatMap(([k, edgeArcs]) =>
                edgeArcs.map((arc, i) => {
                  const isDimmed =
                    hoveredGroupId !== null &&
                    hoveredGroupId !== arc.research_id;
                  const arcOpacity = isDimmed
                    ? DIM_OPACITY
                    : ARC_BASE_OPACITY;
                  const offset =
                    edgeArcs.length === 1
                      ? 0
                      : (i - (edgeArcs.length - 1) / 2) * 0.5;
                  return (
                    <ArcPath
                      key={`arc-${wrapOffset}-${k}-${i}-${arc.research_id}`}
                      from={arc.from}
                      to={arc.to}
                      color={arc.color}
                      opacity={arcOpacity}
                      curveBoost={offset}
                      lngOffset={wrapOffset}
                    />
                  );
                })
              )}

            {/* dot */}
            {showProjectLayer &&
              dotGroups.map(({ key, spots }) => {
                const isDimmed =
                  hoveredGroupId !== null &&
                  !spots.some((s) => s.research_id === hoveredGroupId);

                const fillOp = isDimmed
                  ? DIM_OPACITY
                  : STYLE_CONFIG.marker.fillOpacity;
                const strokeOp = isDimmed ? DIM_OPACITY : 1;

                return (
                  <StackedDot
                    key={`dot-${wrapOffset}-${key}`}
                    spots={spots}
                    baseRadius={baseMarkerRadius}
                    fillOpacity={fillOp}
                    strokeOpacity={strokeOp}
                    isMultiLayer={isMultiLayer}
                    isDimmed={isDimmed}
                    isTouch={isTouch}
                    lngOffset={wrapOffset}
                    onClick={() => openSpot(spots[0])}
                    onMouseOver={() => handleSpotOver(spots)}
                    onMouseOut={handleSpotOut}
                  />
                );
              })}

            {activeLayers.now &&
              data.now.map((n, idx) => {
                const colors = parseColors(n.color);
                const c = colors[0] || '#888888';
                const isCurrent = n.type === 'current';
                return (
                  <CircleMarker
                    key={`now-${wrapOffset}-${idx}-${n.spot_name}`}
                    center={[n.lat, n.lng + wrapOffset]}
                    radius={isCurrent ? baseMarkerRadius + 2 : baseMarkerRadius}
                    pathOptions={{
                      fillColor: isCurrent ? c : '#ffffff',
                      fillOpacity: isCurrent ? 0.95 : 0.6,
                      color: c,
                      weight: 2,
                      opacity: 1,
                      dashArray: !isCurrent ? '4, 3' : undefined,
                      className: isCurrent
                        ? 'now-current-pulse'
                        : undefined,
                    }}
                    eventHandlers={{ click: () => openSpot(n) }}
                  >
                    <Tooltip direction="right" offset={[10, 0]} opacity={0.9}>
                      <span className="spot-label">{n.spot_name}</span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
          </span>
        ))}

        {!isTouch && hoveredSpot && <HoverTooltip spot={hoveredSpot} />}
      </MapContainer>

      {modalContent && (
        <Modal
          content={modalContent}
          onClose={() => setModalContent(null)}
          onSelectStacked={handleStackSelect}
          onRelatedWork={handleRelatedWork}
          onRelatedResearch={handleRelatedResearch}
        />
      )}
    </>
  );
}
