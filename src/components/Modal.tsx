'use client';

import { SpotData } from '@/lib/types';
import { formatDateRange } from '@/lib/formatDate';
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

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

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
    </div>
  );
}
