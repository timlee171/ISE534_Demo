import React, { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom triangle icon for machines
const createTriangleIcon = (color) => {
  return L.divIcon({
    className: "custom-triangle",
    html: `
      <svg width="20" height="20">
        <polygon points="10,0 20,20 0,20" fill="${color}" stroke="black" stroke-width="1"/>
      </svg>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -20],
  });
};

const COMPANY_COLORS = {
  Apple: "#FFFFFF", // White
  Nvidia: "#00FF00", // Green
  Samsung: "#0000FF", // Blue
  Unknown: "#808080", // Grey
};

export default function MapView({ devices = [] }) {
  const [center] = React.useState([51.4606, -0.9325]);
  const [mapReady, setMapReady] = React.useState(false);

  // Filter out any devices at the exact center coordinates
  const filteredDevices = useMemo(() => {
    return devices.filter(device => 
      !device.location || 
      device.location[0] !== center[0] || 
      device.location[1] !== center[1]
    );
  }, [devices, center]);

  // Debug: Log any devices at center point
  useEffect(() => {
    const centerDevices = devices.filter(d => 
      d.location && 
      d.location[0] === center[0] && 
      d.location[1] === center[1]
    );
    if (centerDevices.length > 0) {
      console.warn("Devices at center point:", centerDevices);
    }
  }, [devices, center]);

  // Memoize device rendering
  const renderedDevices = useMemo(() => {
    if (!Array.isArray(filteredDevices)) return [];

    return filteredDevices.map((device) => {
      // Validate device data
      if (!device?.mac_address) return null;
      if (!Array.isArray(device.location) || device.location.length !== 2) return null;

      const color = COMPANY_COLORS[device.company] || COMPANY_COLORS.Unknown;

      if (device.source === "machine") {
        return (
          <Marker
            key={`machine-${device.mac_address}`}
            position={device.location}
            icon={createTriangleIcon(color)}
          >
            <Popup>
              <div>
                <strong>Machine</strong>
                <br />
                Name: {device.name || "Unknown"}
                <br />
                Company: {device.company || "Unknown"}
              </div>
            </Popup>
          </Marker>
        );
      }

      if (device.source === "employee") {
        return (
          <CircleMarker
            key={`employee-${device.mac_address}`}
            center={device.location}
            radius={device.role === "mechanic" ? 5 : 3}
            fillColor={color}
            color={color}
            weight={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div>
                <strong>{device.role === "mechanic" ? "Mechanic" : "Employee"}</strong>
                <br />
                Name: {device.name || "Unknown"}
                <br />
                Company: {device.company || "Unknown"}
              </div>
            </Popup>
          </CircleMarker>
        );
      }

      return null;
    }).filter(Boolean);
  }, [filteredDevices]);

  return (
    <MapContainer 
      center={center} 
      zoom={18} 
      style={{ height: "600px", width: "100%" }}
      zoomControl={true}
      attributionControl={false}
      whenReady={() => setMapReady(true)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {mapReady && renderedDevices}
    </MapContainer>
  );
}