'use client';

import { ResearchGroup } from '@/lib/types';
import { STYLE_CONFIG } from '@/config/mapConfig';

interface ResearchLegendProps {
  groups: ResearchGroup[];
  hoveredGroupId: string | null;
  onHover: (researchId: string) => void;
  onOut: () => void;
}

export default function ResearchLegend({
  groups,
  hoveredGroupId,
  onHover,
  onOut,
}: ResearchLegendProps) {
  if (groups.length === 0) return null;

  return (
    <div className="research-legend">
      <ul className="research-legend-list">
        {groups.map((group) => {
          const isDimmed =
            hoveredGroupId !== null && hoveredGroupId !== group.research_id;
          const dotColor = group.color || STYLE_CONFIG.marker.fillColor;

          return (
            <li
              key={group.research_id}
              className={`research-legend-item${
                isDimmed ? ' research-legend-item-dimmed' : ''
              }`}
              onMouseEnter={() => onHover(group.research_id)}
              onMouseLeave={onOut}
            >
              <span
                className="research-legend-dot"
                style={{ backgroundColor: dotColor }}
              />
              <span className="research-legend-name">
                {group.research_name || group.research_id}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
