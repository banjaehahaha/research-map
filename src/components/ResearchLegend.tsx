'use client';

import { ResearchGroup } from '@/lib/types';
import { STYLE_CONFIG } from '@/config/mapConfig';

interface ResearchLegendProps {
  groups: ResearchGroup[];
  hoveredGroupId: string | null;
  onHover: (researchId: string) => void;
  onOut: () => void;
  onToggle: (researchId: string) => void;
  isTouch: boolean;
}

export default function ResearchLegend({
  groups,
  hoveredGroupId,
  onHover,
  onOut,
  onToggle,
  isTouch,
}: ResearchLegendProps) {
  if (groups.length === 0) return null;

  return (
    <div className="research-legend">
      <ul className="research-legend-list">
        {groups.map((group) => {
          const isDimmed =
            hoveredGroupId !== null && hoveredGroupId !== group.research_id;
          const dotColor = group.color || STYLE_CONFIG.marker.fillColor;

          // 터치: 탭으로 dim 토글 / 데스크탑: 호버
          const interactionProps = isTouch
            ? { onClick: () => onToggle(group.research_id) }
            : {
                onMouseEnter: () => onHover(group.research_id),
                onMouseLeave: onOut,
              };

          return (
            <li
              key={group.research_id}
              className={`research-legend-item${
                isDimmed ? ' research-legend-item-dimmed' : ''
              }`}
              {...interactionProps}
            >
              <span
                className="research-legend-dot"
                style={{ backgroundColor: dotColor }}
              />
              <span className="research-legend-name">
                {group.spots[0]?.title ||
                  group.research_name ||
                  group.research_id}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
