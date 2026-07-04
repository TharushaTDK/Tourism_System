'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:#dc2626;border:2px solid #ffffff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], Math.max(map.getZoom(), 10), { duration: 0.5 }); }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPin = latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude);
  const center: [number, number] = hasPin ? [latitude as number, longitude as number] : [7.8731, 80.7718];

  return (
    <MapContainer center={center} zoom={hasPin ? 11 : 7} style={{ height: '280px', width: '100%', borderRadius: '0.75rem', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      {hasPin && (
        <>
          <Marker
            position={[latitude as number, longitude as number]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = (e.target as L.Marker).getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
          <FlyTo lat={latitude as number} lng={longitude as number} />
        </>
      )}
    </MapContainer>
  );
}
