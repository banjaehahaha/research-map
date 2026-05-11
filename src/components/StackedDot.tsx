'use client';

import { CircleMarker, Tooltip } from 'react-leaflet';
import { ResearchSpot, WorkSpot } from '@/lib/types';
import { parseColors } from '@/lib/groupData';
import { useLanguage } from '@/lib/LanguageContext';
import { pick } from '@/lib/localized';

interface StackedDotProps {
  // 같은 좌표에 위치한 모든 spot들 (Research/Works 섞일 수 있음)
  spots: (ResearchSpot | WorkSpot)[];
  baseRadius: number;
  fillOpacity: number;
  strokeOpacity: number;
  isMultiLayer: boolean;
  isDimmed: boolean;
  isTouch: boolean;
  // 세계 지도 wrap을 위한 경도 오프셋 (-360, 0, +360 중 하나)
  lngOffset?: number;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

const DIM_OPACITY = 0.12;
const RING_GAP = 2.5;

// 한 spot이 갖는 "색깔 + 모양" 단위 (color 컬럼이 쉼표 복수면 여러 단위)
interface Ring {
  color: string;
  // research = 채움 가능, work = 외곽선만
  isResearch: boolean;
}

function buildRings(spots: (ResearchSpot | WorkSpot)[]): Ring[] {
  const rings: Ring[] = [];
  for (const s of spots) {
    const colors = parseColors(s.color);
    const list = colors.length > 0 ? colors : ['#888888'];
    for (const c of list) {
      rings.push({ color: c, isResearch: s.kind === 'research' });
    }
  }
  return rings;
}

export default function StackedDot({
  spots,
  baseRadius,
  fillOpacity,
  strokeOpacity,
  isMultiLayer,
  isDimmed,
  isTouch,
  lngOffset = 0,
  onClick,
  onMouseOver,
  onMouseOut,
}: StackedDotProps) {
  const { lang } = useLanguage();
  const rings = buildRings(spots);
  if (rings.length === 0) return null;

  const head = spots[0];
  const handlers = isTouch
    ? { click: onClick }
    : { click: onClick, mouseover: onMouseOver, mouseout: onMouseOut };

  // Works 마커 단독 100% / 다중 60%
  const workBaseOpacity = isMultiLayer ? 0.6 : 1;
  const workFillOp = isDimmed ? DIM_OPACITY : workBaseOpacity;
  const workStrokeOp = isDimmed ? DIM_OPACITY : workBaseOpacity;

  // 단일 ring: 기존 ProjectDot 스타일과 동일 (Research 채움 / Work 테두리)
  // 다중 ring: 모두 동심원 외곽선만, 가장 안쪽만 첫 spot 종류에 맞춰 채움
  const isSingle = rings.length === 1;

  return (
    <>
      {rings.map((ring, i) => {
        const r = isSingle
          ? ring.isResearch
            ? baseRadius
            : baseRadius - 1
          : baseRadius - i * RING_GAP;
        if (r < 2) return null;

        // 가장 안쪽(마지막) ring만 채움 결정. 나머지는 외곽선만.
        const isInnermost = i === rings.length - 1;

        let path: L.PathOptions;

        if (isSingle) {
          // 기존 단일 spot 스타일
          path = ring.isResearch
            ? {
                fillColor: ring.color,
                fillOpacity,
                color: '#ffffff',
                weight: 1.5,
                opacity: strokeOpacity,
              }
            : {
                fillColor: '#ffffff',
                fillOpacity: workFillOp,
                color: ring.color,
                weight: 2,
                opacity: workStrokeOp,
              };
        } else {
          // 다중 외곽선: 흰 채움 + 색 외곽선. 가장 안쪽만 ring 색으로 채움.
          path = {
            fillColor: isInnermost ? ring.color : '#ffffff',
            fillOpacity: isDimmed
              ? DIM_OPACITY
              : isInnermost
                ? fillOpacity
                : 1,
            color: ring.color,
            weight: 2,
            opacity: isDimmed ? DIM_OPACITY : 1,
          };
        }

        return (
          <CircleMarker
            key={i}
            center={[head.lat, head.lng + lngOffset]}
            radius={r}
            pathOptions={path}
            // 가장 바깥 ring만 인터랙션 받음 (안쪽 ring은 시각 효과만)
            eventHandlers={i === 0 ? handlers : undefined}
            interactive={i === 0}
          >
            {i === 0 && (
              <Tooltip direction="right" offset={[10, 0]} opacity={0.9}>
                <span className="spot-label">
                  {pick(head.spot_name, head.spot_name_kr, lang)}
                </span>
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}
