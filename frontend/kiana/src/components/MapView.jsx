import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const unauthorizedIcon = L.divIcon({
  className: "custom-dot-marker",
  html: `
    <div style="
      background-color: #FF0000;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid #ffffff;
      box-shadow: 0 0 2px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4],
});


const authorizedIcon = L.divIcon({
  className: "custom-dot-marker-authorized",
  html: `
    <div style="
      background-color: #007bff;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid #ffffff;
      box-shadow: 0 0 2px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4],
});




// Component to update map bounds when markers change
function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
}


const MapView = ({ devices }) => {
  const buildingLocation = [51.4605697396, -0.9323233544]; 
  const [markers, setMarkers] = useState([]);

  // Log received devices prop for debugging
  console.log("MapView received devices:", devices, "Type:", typeof devices, "IsArray:", Array.isArray(devices));


  // Update markers when devices change
  useEffect(() => {
    if (!Array.isArray(devices)) {
      console.error("MapView: devices is not an array:", devices);
      setMarkers([]);
      return;
    }
    const newMarkers = devices.map((device) => ({
      mac: device.mac_address,
      lat: device.location[0],
      lng: device.location[1],
      timestamp: device.timestamp,
      authorized: device.authorized,
    }));
    setMarkers(newMarkers);
    console.log("Map markers updated:", newMarkers);
  }, [devices]);

  return (
    <MapContainer
      center={buildingLocation}
      zoom={25}
      style={{ height: "500px", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapBounds markers={markers} />
      {markers.map((marker) => (
        <Marker
          key={marker.mac + marker.timestamp}
          position={[marker.lat, marker.lng]}
          icon={marker.authorized ? authorizedIcon : unauthorizedIcon}
        >
          <Popup>
            <div>
              <strong>MAC:</strong> {marker.mac}<br />
              <strong>Location:</strong> ({marker.lat.toFixed(6)}, {marker.lng.toFixed(6)})<br />
              <strong>Timestamp:</strong> {new Date(marker.timestamp).toLocaleString()}<br />
              <strong>Status:</strong> {marker.authorized ? "Authorized" : "Unauthorized"}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;