import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons for authorized and unauthorized devices
const authorizedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const unauthorizedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
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
  // Default building location (replace with your building's coordinates)
  const buildingLocation = [51.4608217517, -0.9323052216]; 
  const [markers, setMarkers] = useState([]);

  // Update markers when devices change
  useEffect(() => {
    const newMarkers = devices.map((device) => ({
      mac: device.mac_address,
      lat: device.location[0], // Latitude
      lng: device.location[1], // Longitude
      timestamp: device.timestamp,
      authorized: device.authorized,
    }));
    setMarkers(newMarkers);
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