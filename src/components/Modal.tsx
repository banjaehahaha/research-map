'use client';

import { SpotData } from '@/lib/types';
import { formatDateRange } from '@/lib/formatDate';
import { getContrastTextColor } from '@/lib/colorContrast';
import { useEffect } from 'react';
import PhotoGallery from './PhotoGallery';

interface ModalProps {
  spot: SpotData;
  onClose: () => void;
}

export default function Modal({ spot, onClose }: ModalProps) {
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

  const footerLinks: { label: string; url: string }[] = [
    { label: 'Narrative', url: spot.narrative_url },
    { label: 'Work', url: spot.work_url },
    { label: 'Presentation', url: spot.presentation_url },
  ];
  const hasAnyFooterLink = footerLinks.some((link) => link.url);
  const buttonColor = spot.color || '#2563eb';
  const buttonTextColor = getContrastTextColor(buttonColor);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="modal-body">
          <h2 className="modal-title">{spot.title}</h2>
          <div className="modal-meta">
            <span>{spot.spot_name}</span>
            <span className="modal-meta-dot">&middot;</span>
            <span>{formatDateRange(spot.date_start, spot.date_end)}</span>
            {spot.research_name && (
              <>
                <span className="modal-meta-dot">&middot;</span>
                <span>{spot.research_name}</span>
              </>
            )}
          </div>

          <p className="modal-description">{spot.description}</p>

          <PhotoGallery images={spot.image_urls} title={spot.title} />

          {spot.video_url && (
            <div className="modal-video">
              <iframe
                src={spot.video_url
                  .replace('watch?v=', 'embed/')
                  .replace('youtu.be/', 'youtube.com/embed/')}
                title={spot.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {hasAnyFooterLink && (
          <div className="modal-footer">
            {footerLinks.map((link) =>
              link.url ? (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link-btn"
                  style={{
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                  }}
                >
                  {link.label}↗
                </a>
              ) : (
                <span key={link.label} className="modal-link-btn-empty" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
