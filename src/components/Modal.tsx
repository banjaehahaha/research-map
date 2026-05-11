'use client';

import { useEffect } from 'react';
import {
  AnySpot,
  ResearchSpot,
  WorkSpot,
  NowSpot,
} from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { pick } from '@/lib/localized';
import { formatDateRange } from '@/lib/formatDate';
import { getContrastTextColor } from '@/lib/colorContrast';
import { parseColors } from '@/lib/groupData';
import PhotoGallery from './PhotoGallery';

export type ModalContent =
  | { kind: 'detail'; spot: ResearchSpot | WorkSpot | NowSpot }
  | { kind: 'stack'; spots: AnySpot[] };

interface ModalProps {
  content: ModalContent;
  onClose: () => void;
  onSelectStacked: (spot: AnySpot) => void;
  onRelatedWork?: (workId: string) => void;
  onRelatedResearch?: (researchId: string) => void;
}

function embedVideoUrl(url: string): string {
  return url
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'youtube.com/embed/');
}

function firstColor(value: string): string {
  return parseColors(value)[0] || '#2563eb';
}

export default function Modal({
  content,
  onClose,
  onSelectStacked,
  onRelatedWork,
  onRelatedResearch,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop is-bottom-sheet"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {content.kind === 'stack' ? (
          <StackList spots={content.spots} onSelect={onSelectStacked} />
        ) : (
          <DetailView
            spot={content.spot}
            onRelatedWork={onRelatedWork}
            onRelatedResearch={onRelatedResearch}
          />
        )}
      </div>
    </div>
  );
}

/* ===== Stack list (방법 C) ===== */

function StackList({
  spots,
  onSelect,
}: {
  spots: AnySpot[];
  onSelect: (spot: AnySpot) => void;
}) {
  const { lang } = useLanguage();
  const first = spots[0];
  const placeName = first
    ? pick(
        first.spot_name,
        'spot_name_kr' in first ? first.spot_name_kr : '',
        lang
      )
    : '';

  return (
    <div className="modal-body">
      <h2 className="modal-title">{placeName}</h2>
      <div className="modal-meta">
        <span>
          {spots.length} {lang === 'kr' ? '항목' : 'items'}
        </span>
      </div>
      <ul className="modal-related-list">
        {spots.map((s, i) => {
          const c = firstColor(s.color);
          const isHollow = s.kind === 'work';
          const labelLeft =
            s.kind === 'research'
              ? pick(s.research_name, s.research_name_kr, lang) || s.research_id
              : s.kind === 'work'
                ? pick(s.title, s.title_kr, lang) || s.work_id
                : pick(s.title, s.title_kr, lang) || s.spot_name;
          const labelRight =
            s.kind === 'research'
              ? pick(s.title, s.title_kr, lang)
              : s.kind === 'work'
                ? pick(s.venue, s.venue_kr, lang)
                : s.type === 'current'
                  ? lang === 'kr'
                    ? '현재 위치'
                    : 'Current'
                  : lang === 'kr'
                    ? '예정'
                    : 'Upcoming';
          return (
            <li key={`stack-${i}`}>
              <button
                type="button"
                className="modal-related-item"
                onClick={() => onSelect(s)}
              >
                <span
                  className={isHollow ? 'modal-related-dot-hollow' : 'modal-related-dot'}
                  style={
                    isHollow
                      ? { border: `2px solid ${c}` }
                      : { backgroundColor: c }
                  }
                />
                <span style={{ flex: 1 }}>
                  <strong>{labelLeft}</strong>
                  {labelRight ? ` — ${labelRight}` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ===== Detail view dispatch ===== */

function DetailView({
  spot,
  onRelatedWork,
  onRelatedResearch,
}: {
  spot: ResearchSpot | WorkSpot | NowSpot;
  onRelatedWork?: (workId: string) => void;
  onRelatedResearch?: (researchId: string) => void;
}) {
  if (spot.kind === 'research') {
    return <ResearchDetail spot={spot} onRelatedWork={onRelatedWork} />;
  }
  if (spot.kind === 'work') {
    return <WorkDetail spot={spot} onRelatedResearch={onRelatedResearch} />;
  }
  return <NowDetail spot={spot} />;
}

/* ===== Research detail ===== */

function ResearchDetail({
  spot,
  onRelatedWork,
}: {
  spot: ResearchSpot;
  onRelatedWork?: (workId: string) => void;
}) {
  const { lang } = useLanguage();
  const buttonColor = firstColor(spot.color);
  const buttonTextColor = getContrastTextColor(buttonColor);

  const title = pick(spot.title, spot.title_kr, lang);
  const description = pick(spot.description, spot.description_kr, lang);
  const details = pick(
    spot.description_details,
    spot.description_details_kr,
    lang
  );
  const placeName = pick(spot.spot_name, spot.spot_name_kr, lang);
  const researchName = pick(spot.research_name, spot.research_name_kr, lang);

  const links: { label: string; url?: string }[] = [
    { label: 'Narrative', url: spot.narrative_url || undefined },
  ];
  const hasFooter = links.some((l) => l.url) || spot.related_work_ids.length > 0;

  return (
    <>
      <div className="modal-body">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-meta">
          <span>{placeName}</span>
          <span className="modal-meta-dot">&middot;</span>
          <span>{formatDateRange(spot.date_start, spot.date_end)}</span>
          {researchName && (
            <>
              <span className="modal-meta-dot">&middot;</span>
              <span>{researchName}</span>
            </>
          )}
        </div>

        {description && <p className="modal-description">{description}</p>}
        {details && <p className="modal-description-details">{details}</p>}

        <PhotoGallery images={spot.image_urls} title={title} />

        {spot.video_url && (
          <div className="modal-video">
            <iframe
              src={embedVideoUrl(spot.video_url)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {spot.related_work_ids.length > 0 && onRelatedWork && (
          <>
            <div className="modal-section-heading">
              {lang === 'kr' ? '관련 작업' : 'Related Works'}
            </div>
            <ul className="modal-related-list">
              {spot.related_work_ids.map((wid) => (
                <li key={wid}>
                  <button
                    type="button"
                    className="modal-related-item"
                    onClick={() => onRelatedWork(wid)}
                  >
                    <span
                      className="modal-related-dot-hollow"
                      style={{ border: `2px solid ${buttonColor}` }}
                    />
                    <span>{wid}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {hasFooter && (
        <div className="modal-footer">
          {links.map((l) =>
            l.url ? (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link-btn"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
              >
                {l.label}↗
              </a>
            ) : null
          )}
        </div>
      )}
    </>
  );
}

/* ===== Work detail ===== */

function WorkDetail({
  spot,
  onRelatedResearch,
}: {
  spot: WorkSpot;
  onRelatedResearch?: (researchId: string) => void;
}) {
  const { lang } = useLanguage();
  const buttonColor = firstColor(spot.color);
  const buttonTextColor = getContrastTextColor(buttonColor);

  const title = pick(spot.title, spot.title_kr, lang);
  const description = pick(spot.description, spot.description_kr, lang);
  const details = pick(
    spot.description_details,
    spot.description_details_kr,
    lang
  );
  const venue = pick(spot.venue, spot.venue_kr, lang);
  const placeName = pick(spot.spot_name, spot.spot_name_kr, lang);

  // Phase 4 단순화: work_urls만 갤러리로. exhibition_urls/text_urls는 추후 별도 섹션 가능.
  const allImages = [...spot.work_urls, ...spot.exhibition_urls];

  const links: { label: string; url?: string }[] = [
    { label: 'Narrative', url: spot.narrative_url || undefined },
    { label: 'Texts', url: spot.text_urls[0] || undefined },
  ];
  const hasFooter = links.some((l) => l.url);

  return (
    <>
      <div className="modal-body">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-meta">
          {venue && <span>{venue}</span>}
          {venue && <span className="modal-meta-dot">&middot;</span>}
          <span>{placeName}</span>
          <span className="modal-meta-dot">&middot;</span>
          <span>{formatDateRange(spot.date_start, spot.date_end)}</span>
          {description && (
            <>
              <span className="modal-meta-dot">&middot;</span>
              <span>{description}</span>
            </>
          )}
        </div>

        {details && <p className="modal-description-details">{details}</p>}

        <PhotoGallery images={allImages} title={title} />

        {spot.video_url && (
          <div className="modal-video">
            <iframe
              src={embedVideoUrl(spot.video_url)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {spot.text_urls.length > 1 && (
          <>
            <div className="modal-section-heading">
              {lang === 'kr' ? '관련 텍스트' : 'Texts'}
            </div>
            <ul className="modal-related-list">
              {spot.text_urls.map((u, i) => (
                <li key={i}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-related-item"
                  >
                    <span
                      className="modal-related-dot-hollow"
                      style={{ border: `2px solid ${buttonColor}` }}
                    />
                    <span>{u}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {spot.research_id && onRelatedResearch && (
          <button
            type="button"
            className="modal-related-item"
            style={{ marginTop: 16 }}
            onClick={() => onRelatedResearch(spot.research_id)}
          >
            <span
              className="modal-related-dot"
              style={{ backgroundColor: buttonColor }}
            />
            <span>
              {lang === 'kr' ? '리서치 보기' : 'See Research'} → {spot.research_id}
            </span>
          </button>
        )}
      </div>

      {hasFooter && (
        <div className="modal-footer">
          {links.map((l) =>
            l.url ? (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link-btn"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
              >
                {l.label}↗
              </a>
            ) : null
          )}
        </div>
      )}
    </>
  );
}

/* ===== Now detail ===== */

function NowDetail({ spot }: { spot: NowSpot }) {
  const { lang } = useLanguage();
  const buttonColor = firstColor(spot.color);
  const buttonTextColor = getContrastTextColor(buttonColor);

  const title = pick(spot.title, spot.title_kr, lang);
  const description = pick(spot.description, spot.description_kr, lang);
  const venue = pick(spot.venue, spot.venue_kr, lang);

  const links: { label: string; url?: string }[] = [];
  if (spot.type === 'current' && spot.cv_url) {
    links.push({ label: 'CV', url: spot.cv_url });
  }
  if (spot.event_url) {
    links.push({ label: 'Event', url: spot.event_url });
  }
  const hasFooter = links.some((l) => l.url);

  return (
    <>
      <div className="modal-body">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-meta">
          {venue && <span>{venue}</span>}
          {venue && <span className="modal-meta-dot">&middot;</span>}
          <span>{spot.spot_name}</span>
          {spot.date_start && (
            <>
              <span className="modal-meta-dot">&middot;</span>
              <span>{formatDateRange(spot.date_start, spot.date_end)}</span>
            </>
          )}
          <span className="modal-meta-dot">&middot;</span>
          <span>
            {spot.type === 'current'
              ? lang === 'kr'
                ? '현재 위치'
                : 'Currently here'
              : lang === 'kr'
                ? '예정'
                : 'Upcoming'}
          </span>
        </div>

        {description && <p className="modal-description">{description}</p>}

        {spot.thumbnail_url && (
          <PhotoGallery images={[spot.thumbnail_url]} title={title} />
        )}

        {spot.video_url && (
          <div className="modal-video">
            <iframe
              src={embedVideoUrl(spot.video_url)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {hasFooter && (
        <div className="modal-footer">
          {links.map((l) =>
            l.url ? (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link-btn"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
              >
                {l.label}↗
              </a>
            ) : null
          )}
        </div>
      )}
    </>
  );
}
