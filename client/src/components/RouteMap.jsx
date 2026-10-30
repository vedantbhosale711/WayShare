import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color, label) => L.divIcon({
  html: `<div style="background:${color};color:white;border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg)">${label}</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: '',
});

export const originIcon = makeIcon('#16a34a', 'A');
export const destinationIcon = makeIcon('#dc2626', 'B');
export const stopIcon = (n) => makeIcon('#2563eb', n);

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      } catch {}
    } else if (points && points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [points, map]);
  return null;
}

export default function RouteMap({
  origin, destination, stops = [], routeCoords = [],
  height = '400px', showPopups = true, interactive = true,
}) {
  const center = origin
    ? [parseFloat(origin.lat), parseFloat(origin.lng)]
    : [20.5937, 78.9629]; // India center

  const markers = [];
  if (origin) markers.push({ pos: [parseFloat(origin.lat), parseFloat(origin.lng)], icon: originIcon, label: origin.address || 'Origin' });
  stops.forEach((s, i) => {
    if (s.lat && s.lng) markers.push({ pos: [parseFloat(s.lat), parseFloat(s.lng)], icon: stopIcon(i + 1), label: s.address || `Stop ${i + 1}` });
  });
  if (destination) markers.push({ pos: [parseFloat(destination.lat), parseFloat(destination.lng)], icon: destinationIcon, label: destination.address || 'Destination' });

  const allPoints = markers.map(m => m.pos);

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={interactive} dragging={interactive} scrollWheelZoom={interactive}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />
        {markers.map((m, i) => (
          <Marker key={i} position={m.pos} icon={m.icon}>
            {showPopups && <Popup><span className="text-sm font-medium">{m.label}</span></Popup>}
          </Marker>
        ))}
        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} color="#16a34a" weight={4} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
}
