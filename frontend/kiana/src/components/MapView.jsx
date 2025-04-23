import React, { useMemo } from "react";
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
    iconSize: [10, 10],
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
  const [center] = React.useState([51.4606, -0.9325]); // Centered on building

  // Memoize device rendering
  const renderedDevices = useMemo(() => {
    // Ensure devices is an array
    if (!Array.isArray(devices)) {
      console.warn("Devices prop is not an array:", devices);
      return [];
    }

    return devices.map((device) => {
      // Validate device data
      if (!device || !device.mac_address) {
        console.warn("Invalid device data:", device);
        return null;
      }

      // Validate location
      if (
        !device.location ||
        !Array.isArray(device.location) ||
        device.location.length !== 2 ||
        typeof device.location[0] !== "number" ||
        typeof device.location[1] !== "number"
      ) {
        console.warn("Invalid location for device:", device.mac_address, device.location);
        return null;
      }

      const color = COMPANY_COLORS[device.company] || COMPANY_COLORS.Unknown;

      if (device.source === "machine") {
        return (
          <Marker
            key={device.mac_address}
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
                <br />
                Level: {device.level || "Unknown"}
              </div>
            </Popup>
          </Marker>
        );
      } else if (device.source === "employee") {
        const radius = device.role === "mechanic" ? 5 : 3; // Mechanic: larger, Staff: smaller
        return (
          <CircleMarker
            key={device.mac_address}
            center={device.location}
            radius={radius}
            fillColor={color}
            color={color}
            weight={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div>
                <strong>{device.role === "mechanic" ? "Mechanic" : "Regular Employee"}</strong>
                <br />
                Name: {device.name || "Unknown"}
                <br />
                Role: {device.role === "mechanic" ? "Mechanic" : "Regular Employee"}
                <br />
                Company: {device.company || "Unknown"}
                <br />
                Location: {`[${device.location[0]}, ${device.location[1]}]`}
                <br />
                Level: {device.level || "Unknown"}
              </div>
            </Popup>
          </CircleMarker>
        );
      }

      console.warn("Skipped device with unknown source:", device.mac_address, device.source);
      return null;
    }).filter(Boolean); // Remove null entries
  }, [devices]);

  return (
    <MapContainer center={center} zoom={18} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {renderedDevices}
    </MapContainer>
  );
}