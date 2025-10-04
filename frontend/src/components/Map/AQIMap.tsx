import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface AQIMapProps {
  center: [number, number];
  stations: Array<{
    lat: number;
    lon: number;
    aqi: number;
  }>;
}

export const AQIMap: React.FC<AQIMapProps> = ({ center, stations }) => {
  return (
    <MapContainer center={center} zoom={13} style={{ height: '400px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station, index) => (
        <Circle
          key={index}
          center={[station.lat, station.lon]}
          radius={500}
          color={station.aqi <= 50 ? 'green' : station.aqi <= 100 ? 'yellow' : 'red'}
        />
      ))}
    </MapContainer>
  );
};
