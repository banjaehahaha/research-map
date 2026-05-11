'use client';

import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { ResearchSpot } from '@/lib/types';
import { formatDateRange } from '@/lib/formatDate';

interface HoverTooltipProps {
  spot: ResearchSpot;
}

export default function HoverTooltip({ spot }: HoverTooltipProps) {
  const map = useMap();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const point = map.latLngToContainerPoint([spot.lat, spot.lng]);
      setPosition({ x: point.x, y: point.y });
    };

    updatePosition();
    map.on('zoom move', updatePosition);
    return () => {
      map.off('zoom move', updatePosition);
    };
  }, [map, spot.lat, spot.lng]);

  return (
    <div
      className="hover-tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {spot.thumbnail_url && (
        <img
          src={spot.thumbnail_url}
          alt={spot.title}
          className="hover-tooltip-img"
        />
      )}
      <div className="hover-tooltip-title">{spot.title}</div>
      <div className="hover-tooltip-date">
        {formatDateRange(spot.date_start, spot.date_end)}
      </div>
    </div>
  );
}
