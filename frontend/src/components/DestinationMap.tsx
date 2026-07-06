'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Destination } from '@/types';

interface DestinationMapProps {
  destinations: Destination[];
  selectedIds: number[];
  suggestedIds?: number[];
  onToggle: (id: number) => void;
}

function markerIcon(emoji: string, selected: boolean, suggested: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:38px;height:38px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${selected ? '#2563eb' : '#ffffff'};
        border:2px solid ${selected ? '#1d4ed8' : suggested ? '#f59e0b' : '#94a3b8'};
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${emoji}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
}

export default function DestinationMap({ destinations, selectedIds, suggestedIds = [], onToggle }: DestinationMapProps) {
  const withCoords = destinations.filter((d) => d.latitude != null && d.longitude != null);

  return (
    <div className="h-[300px] sm:h-[420px] w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((d) => {
          const selected = selectedIds.includes(d.id);
          const suggested = suggestedIds.includes(d.id);
          return (
            <Marker
              key={d.id}
              position={[Number(d.latitude), Number(d.longitude)]}
              icon={markerIcon(d.emoji || '📍', selected, suggested)}
              eventHandlers={{ click: () => onToggle(d.id) }}
            >
              <Popup>
                <div className="text-sm font-semibold text-gray-800">{d.emoji} {d.name}</div>
                <div className="text-xs text-gray-500 mb-2">{d.province}</div>
                <button
                  onClick={() => onToggle(d.id)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${selected ? 'bg-red-50 text-red-600' : 'bg-blue-600 text-white'}`}
                >
                  {selected ? 'Remove' : 'Select'}
                </button>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
