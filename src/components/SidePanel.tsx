'use client';

import { ProjectGroup, TabId } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { pick } from '@/lib/localized';

interface SidePanelProps {
  groups: ProjectGroup[];
  hoveredGroupId: string | null;
  onHover: (researchId: string) => void;
  onOut: () => void;
  onToggle: (researchId: string) => void;
  isTouch: boolean;
  activeLayers: Record<TabId, boolean>;
  onLayerToggle: (layer: TabId) => void;
}

const LAYERS: { id: TabId; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'works', label: 'Works' },
  { id: 'now', label: 'Now' },
];

export default function SidePanel({
  groups,
  hoveredGroupId,
  onHover,
  onOut,
  onToggle,
  isTouch,
  activeLayers,
  onLayerToggle,
}: SidePanelProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div className="side-panel">
      <div className="side-panel-lang" role="group" aria-label="Language">
        <button
          type="button"
          className={`lang-btn${lang === 'en' ? ' lang-btn-active' : ''}`}
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <span className="lang-divider" aria-hidden="true">|</span>
        <button
          type="button"
          className={`lang-btn${lang === 'kr' ? ' lang-btn-active' : ''}`}
          onClick={() => setLang('kr')}
        >
          KR
        </button>
      </div>

      <div className="side-panel-layers" role="group" aria-label="Layers">
        {LAYERS.map((layer) => (
          <label key={layer.id} className="side-panel-layer-toggle">
            <input
              type="checkbox"
              checked={activeLayers[layer.id]}
              onChange={() => onLayerToggle(layer.id)}
            />
            <span>{layer.label}</span>
          </label>
        ))}
      </div>

      {groups.length > 0 && (
        <ul className="side-panel-list">
          {groups.map((group) => {
            const isDimmed =
              hoveredGroupId !== null && hoveredGroupId !== group.research_id;

            const interactionProps = isTouch
              ? { onClick: () => onToggle(group.research_id) }
              : {
                  onMouseEnter: () => onHover(group.research_id),
                  onMouseLeave: onOut,
                };

            return (
              <li
                key={group.research_id}
                className={`side-panel-item${
                  isDimmed ? ' side-panel-item-dimmed' : ''
                }`}
                {...interactionProps}
              >
                <span className="side-panel-dots">
                  {group.colors.length > 0 ? (
                    group.colors.map((c, i) => (
                      <span
                        key={i}
                        className="side-panel-dot"
                        style={{ backgroundColor: c }}
                      />
                    ))
                  ) : (
                    <span
                      className="side-panel-dot"
                      style={{ backgroundColor: group.primary_color }}
                    />
                  )}
                </span>
                <span className="side-panel-name">
                  {pick(
                    group.research_name,
                    group.research_name_kr,
                    lang
                  ) || group.research_id}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
