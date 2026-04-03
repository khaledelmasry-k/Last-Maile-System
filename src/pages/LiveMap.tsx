import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useLogistics } from '../context/LogisticsContext';
import { useTheme } from '../context/ThemeContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Custom icons using Tailwind and Lucide icons rendered as HTML
const createCourierIcon = (name: string) => L.divIcon({
  className: 'custom-icon',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full shadow-lg border-2 border-black text-black font-bold z-50">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      <div class="absolute -bottom-6 whitespace-nowrap bg-black text-white text-[10px] px-2 py-0.5 rounded font-mono">${name}</div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const createShipmentIcon = (status: string) => {
  const colorClass = status === 'Delivered' ? 'bg-green-500' : 'bg-blue-500';
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 ${colorClass} rounded-full shadow-lg border-2 border-black text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const LiveMap = () => {
  const { couriers, shipments } = useLogistics();
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Active couriers with locations
  const activeCouriers = couriers.filter(c => c.active && c.location);
  
  // Shipments that are assigned or out for delivery and have destinations
  const activeShipments = shipments.filter(s => 
    ['Assigned', 'OutForDelivery'].includes(s.status) && s.destination
  );

  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="page-wrap flex flex-col h-full text-gray-900 dark:text-white transition-colors duration-200">
      <header className="mb-6">
        <h1 className="text-3xl font-bold font-sans tracking-tight">{t('Live Tracking')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm uppercase">{t('Real-time Courier & Shipment Locations')}</p>
      </header>

      <div className="flex-1 relative z-0">
        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] shadow-2xl relative">
          {activeCouriers.length === 0 && activeShipments.length === 0 ? (
            <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center bg-black/20">
              <div className="pointer-events-auto rounded-xl border border-gray-200 dark:border-[#333] bg-white/95 dark:bg-[#121212]/95 px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                {t('No live courier locations yet.')}
              </div>
            </div>
          ) : null}
          <MapContainer 
            center={[30.0444, 31.2357]} // Cairo center
            zoom={12} 
            style={{ height: '100%', width: '100%', background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6' }}
            key={theme} // Force re-render when theme changes to update tiles properly
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={tileUrl}
            />
            
            {/* Render Routes (Polylines) */}
            {activeShipments.map(shipment => {
              const courier = activeCouriers.find(c => c.id === shipment.assignedTo);
              if (courier && courier.location && shipment.destination) {
                return (
                  <Polyline 
                    key={`route-${shipment.id}`}
                    positions={[
                      [courier.location.lat, courier.location.lng],
                      [shipment.destination.lat, shipment.destination.lng]
                    ]}
                    color="#f97316" // Tailwind orange-500
                    weight={3}
                    dashArray="5, 10"
                    opacity={0.7}
                  />
                );
              }
              return null;
            })}

            {/* Render Couriers */}
            {activeCouriers.map(courier => (
              <Marker 
                key={`courier-${courier.id}`} 
                position={[courier.location!.lat, courier.location!.lng]}
                icon={createCourierIcon(courier.name)}
              >
                <Popup className="custom-popup">
                  <div className="font-sans">
                    <h3 className="font-bold text-lg text-black">{courier.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{courier.vehicle}</p>
                    <p className="text-sm text-gray-600 mt-1">{courier.phone}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Active Shipments */}
            {activeShipments.map(shipment => (
              <Marker 
                key={`shipment-${shipment.id}`} 
                position={[shipment.destination!.lat, shipment.destination!.lng]}
                icon={createShipmentIcon(shipment.status)}
              >
                <Popup className="custom-popup">
                  <div className="font-sans">
                    <h3 className="font-bold text-lg text-black">{shipment.trackingNumber}</h3>
                    <p className="text-sm text-gray-600">{shipment.customerName}</p>
                    <p className="text-xs font-mono mt-2 bg-gray-100 px-2 py-1 rounded inline-block text-black">
                      {t(shipment.status)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
