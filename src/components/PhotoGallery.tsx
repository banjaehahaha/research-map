'use client';

import { useState } from 'react';

interface PhotoGalleryProps {
  images: string[];
  title: string;
}

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openViewer = (index: number) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    );
  };

  return (
    <>
      {/* 그리드 썸네일 */}
      <div className="modal-gallery">
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${title} - ${i + 1}`}
            className="modal-gallery-img"
            onClick={() => openViewer(i)}
          />
        ))}
      </div>

      {/* 풀스크린 뷰어 */}
      {viewerIndex !== null && (
        <div className="viewer-backdrop" onClick={closeViewer}>
          <button className="viewer-close" onClick={closeViewer}>
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button className="viewer-nav viewer-prev" onClick={goPrev}>
                &#8249;
              </button>
              <button className="viewer-nav viewer-next" onClick={goNext}>
                &#8250;
              </button>
            </>
          )}

          <img
            src={images[viewerIndex]}
            alt={`${title} - ${viewerIndex + 1}`}
            className="viewer-img"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="viewer-counter">
            {viewerIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
