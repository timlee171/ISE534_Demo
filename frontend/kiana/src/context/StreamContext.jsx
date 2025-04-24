import React, { createContext, useState, useEffect, useRef, useMemo } from "react";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]); // New state for static employee data
  const [machineStatuses, setMachineStatuses] = useState({});
  const [rtlsData, setRtlsData] = useState({});
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [unauthorizedDevices, setUnauthorizedDevices] = useState([]);
  const [zoneViolations, setZoneViolations] = useState([]);
  const machineSourceRef = useRef(null);
  const rtlsSourceRef = useRef(null);

  console.log("StreamProvider initialized:", {
    unauthorizedDevices,
    zoneViolations,
    rtlsData,
    machines,
    employees
  });

  // Fetch static machine data
  useEffect(() => {
    const fetchMachines = async (attempt = 1, maxAttempts = 3, delay = 5000) => {
      try {
        console.log(`Fetching machines, attempt ${attempt}`);
        const response = await fetch("http://localhost:5000/machines");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setMachines(data);
        console.log("Machines fetched:", data);
      } catch (error) {
        console.error(`Error fetching machines (attempt ${attempt}):`, error.message);
        if (attempt < maxAttempts) {
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchMachines(attempt + 1, maxAttempts, delay), delay);
        } else {
          console.error("Max attempts reached for fetching machines");
        }
      }
    };

    fetchMachines();
  }, []);

  // Fetch static employee data
  useEffect(() => {
    const fetchEmployees = async (attempt = 1, maxAttempts = 3, delay = 5000) => {
      try {
        console.log(`Fetching employees, attempt ${attempt}`);
        const response = await fetch("http://localhost:5000/devices");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setEmployees(data);
        console.log("Employees fetched:", data);
      } catch (error) {
        console.error(`Error fetching employees (attempt ${attempt}):`, error.message);
        if (attempt < maxAttempts) {
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchEmployees(attempt + 1, maxAttempts, delay), delay);
        } else {
          console.error("Max attempts reached for fetching employees");
        }
      }
    };

    fetchEmployees();
  }, []);

  // Stream machine maintenance data
  useEffect(() => {
    const connectMachineStream = (attempt = 1, maxAttempts = 5) => {
      console.log(`Connecting to machine stream, attempt ${attempt}`);
      machineSourceRef.current = new EventSource("http://localhost:5000/stream/machine");

      machineSourceRef.current.onopen = () => {
        console.log("Machine EventSource connected");
      };

      machineSourceRef.current.addEventListener("machine", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Machine status log:", {
            machine_id: data.machine_id,
            mac_address: data.mac_address,
            rul: data.rul,
            status: data.status
          });
          setMachineStatuses((prev) => ({
            ...prev,
            [data.machine_id]: data
          }));
        } catch (error) {
          console.error("Error parsing machine data:", error);
        }
      });

      machineSourceRef.current.addEventListener("maintenance", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Maintenance notification:", data);
          setNotificationHistory((prev) => [data, ...prev]);
        } catch (error) {
          console.error("Error parsing maintenance data:", error);
        }
      });

      machineSourceRef.current.onerror = (error) => {
        console.error("Machine EventSource error:", error);
        machineSourceRef.current.close();
        if (attempt < maxAttempts) {
          console.log(`Reconnecting machine stream in 5s, attempt ${attempt + 1}`);
          setTimeout(() => connectMachineStream(attempt + 1, maxAttempts), 5000);
        } else {
          console.error("Max reconnection attempts reached for machine stream");
        }
      };
    };

    connectMachineStream();

    return () => {
      if (machineSourceRef.current) {
        machineSourceRef.current.close();
        console.log("Machine EventSource closed");
      }
    };
  }, []);

  // Stream RTLS data (employees only)
  useEffect(() => {
    const connectRtlsStream = (attempt = 1, maxAttempts = 5) => {
      console.log(`Connecting to RTLS stream, attempt ${attempt}`);
      rtlsSourceRef.current = new EventSource("http://localhost:5000/stream/rtls");

      rtlsSourceRef.current.onopen = () => {
        console.log("RTLS EventSource connected");
      };

      // In your StreamProvider's RTLS update handler:
      rtlsSourceRef.current.addEventListener("update", (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only update RTLS data when we have actual location info
          if (data.location && data.location.length === 2) {
            setRtlsData((prev) => ({
              ...prev,
              [data.mac_address]: data
            }));
          }
        } catch (error) {
          console.error("Error parsing RTLS data:", error);
        }
      });

      // Updated RTLS stream handler in StreamProvider
      rtlsSourceRef.current.addEventListener("zone_violation", (event) => {
        try {
            const rawData = JSON.parse(event.data);
            
            // Normalize the data structure
            const normalizedData = {
                ...rawData,
                // Ensure all required fields exist
                type: rawData.type || "zone_violation",
                mac_address: rawData.mac_address || rawData.mac,
                floor: rawData.floor || "ground", // Default to ground if missing
                timestamp: rawData.timestamp || new Date().toISOString()
            };

            console.log("Normalized zone violation:", normalizedData);
            
            setZoneViolations(prev => [normalizedData, ...prev]);
            setNotificationHistory(prev => [normalizedData, ...prev]);
        } catch (error) {
            console.error("Error processing zone violation:", error);
        }
      });

      rtlsSourceRef.current.onerror = (error) => {
        console.error("RTLS EventSource error:", error);
        rtlsSourceRef.current.close();
        if (attempt < maxAttempts) {
          console.log(`Reconnecting RTLS stream in 5s, attempt ${attempt + 1}`);
          setTimeout(() => connectRtlsStream(attempt + 1, maxAttempts), 5000);
        } else {
          console.error("Max reconnection attempts reached for RTLS stream");
        }
      };
    };

    connectRtlsStream();

    return () => {
      if (rtlsSourceRef.current) {
        rtlsSourceRef.current.close();
        console.log("RTLS EventSource closed");
      }
    };
  }, []);

  // Stabilize context value
  const contextValue = useMemo(
    () => ({
      machines,
      employees, // Added
      machineStatuses,
      rtlsData,
      notificationHistory,
      unauthorizedDevices,
      zoneViolations,
      setNotificationHistory,
      setUnauthorizedDevices,
    }),
    [
      machines,
      employees,
      machineStatuses,
      rtlsData,
      notificationHistory,
      unauthorizedDevices,
      zoneViolations,
      setNotificationHistory,
      setUnauthorizedDevices,
    ]
  );

  return (
    <StreamContext.Provider value={contextValue}>
      {children}
    </StreamContext.Provider>
  );
};