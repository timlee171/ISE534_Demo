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

const employeeIcon = L.divIcon({
  className: "custom-dot-marker-employee",
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

const visitorIcon = L.divIcon({
  className: "custom-dot-marker-visitor",
  html: `
    <div style="
      background-color: #ffc107;
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

const unauthorizedIcon = L.divIcon({
  className: "custom-dot-marker-unauthorized",
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

const machineIcon = L.divIcon({
  className: "custom-dot-marker-machine",
  html: `
    <div style="
      background-color: #00FF00;
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
  const [machines, setMachines] = useState([]);

  // Log received devices prop for debugging
  console.log("MapView received devices:", devices, "Type:", typeof devices, "IsArray:", Array.isArray(devices));

  // Fetch machine data
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch("http://localhost:5000/machines");
        const data = await response.json();
        if (Array.isArray(data)) {
          setMachines(data);
          console.log("Machines fetched:", JSON.stringify(data, null, 2));
        } else {
          console.error("Invalid machine data:", data);
        }
      } catch (error) {
        console.error("Error fetching machines:", error);
      }
    };
    fetchMachines();
  }, []);

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
      authorized: device.authorized,
      source: device.source || null,
    }));
    setMarkers(newMarkers);
    console.log("Map markers updated:", newMarkers);
  }, [devices]);

  // Combine device and machine markers for map bounds
  const allMarkers = [
    ...markers.map((m) => ({ lat: m.lat, lng: m.lng })),
    ...machines.map((m) => ({ lat: m.lat, lng: m.lng })),
  ];

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
      <MapBounds markers={allMarkers} />
      {/* RTLS device markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.mac}
          position={[marker.lat, marker.lng]}
          icon={
            marker.authorized && marker.source === "employee"
              ? employeeIcon
              : marker.authorized && marker.source === "visitor"
              ? visitorIcon
              : unauthorizedIcon
          }
        >
          <Popup>
            <div>
              <strong>MAC:</strong> {marker.mac}<br />
              <strong>Location:</strong> ({marker.lat.toFixed(6)}, {marker.lng.toFixed(6)})<br />
              <strong>Level:</strong> Ground Floor<br />
              <strong>Status:</strong> {marker.authorized ? "Authorized" : "Unauthorized"}<br />
              <strong>Source:</strong> {marker.source || "None"}
            </div>
          </Popup>
        </Marker>
      ))}
      {/* Machine markers */}
      {machines.map((machine) => (
        <Marker
          key={machine.mac_address}
          position={[machine.lat, machine.lng]}
          icon={machineIcon}
        >
          <Popup>
            <div>
              <strong>Company:</strong> {machine.company}<br />
              <strong>Machine Name:</strong> {machine.name}<br />
              <strong>Location:</strong> ({machine.lat}, {machine.lng})<br />
              <strong>Level:</strong> {machine.floor_name}<br />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
