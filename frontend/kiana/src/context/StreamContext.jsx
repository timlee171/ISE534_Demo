import React, { createContext, useEffect, useState, useRef } from "react";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const updateCallbacks = useRef([]);
  const unauthorizedCallbacks = useRef([]);
  const machineCallbacks = useRef([]);
  const maintenanceCallbacks = useRef([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [machineStatuses, setMachineStatuses] = useState({});

  useEffect(() => {
    if (!sessionStorage.getItem("hasClearedHistory")) {
      localStorage.removeItem("notificationHistory");
      sessionStorage.setItem("hasClearedHistory", "true");
      setNotificationHistory([]);
    } else {
      const stored = JSON.parse(localStorage.getItem("notificationHistory")) || [];
      setNotificationHistory(stored);
    }
  }, []);

  // Fetch machine data
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch("http://localhost:5000/machines");
        const data = await response.json();
        if (Array.isArray(data)) {
          setMachines(data);
          console.log("StreamContext machines fetched:", JSON.stringify(data, null, 2));
        } else {
          console.error("Invalid machine data:", data);
        }
      } catch (error) {
        console.error("Error fetching machines:", error);
      }
    };
    fetchMachines();
  }, []);

  // Add notification and sync with localStorage
  const addNotification = (notification) => {
    setNotificationHistory((prev) => {
      const isDuplicate = prev.some(
        (n) =>
          n.timestamp === notification.timestamp &&
          n.mac === notification.mac &&
          n.message === notification.message &&
          n.location === notification.location &&
          n.type === notification.type
      );
      if (isDuplicate) return prev;

      const updated = [...prev, notification];
      localStorage.setItem("notificationHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const onUpdate = (callback) => {
    updateCallbacks.current.push(callback);
  };

  const onUnauthorized = (callback) => {
    unauthorizedCallbacks.current.push(callback);
  };

  const onMachine = (callback) => {
    machineCallbacks.current.push(callback);
  };

  const onMaintenance = (callback) => {
    maintenanceCallbacks.current.push(callback);
  };

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/stream/rtls");

    eventSource.onmessage = (event) => {
      console.log("Received event:", event.data);
    };

    eventSource.addEventListener("update", (event) => {
      const data = JSON.parse(event.data);
      console.log("Stream update:", data);
      updateCallbacks.current.forEach((callback) => callback(data));
    });

    eventSource.addEventListener("unauthorized", (event) => {
      const data = JSON.parse(event.data);
      console.log("Stream unauthorized:", data);
      unauthorizedCallbacks.current.forEach((callback) => callback(data));
    });

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    const machineSource = new EventSource("http://localhost:5000/stream/machine");

    machineSource.onmessage = (event) => {
      console.log("Machine event:", event.data);
    };

    machineSource.addEventListener("machine", (event) => {
      const data = JSON.parse(event.data);
      console.log("Machine log:", JSON.stringify(data, null, 2));
      setMachineStatuses((prev) => ({
        ...prev,
        [data.machine_id]: data
      }));
      machineCallbacks.current.forEach((callback) => callback(data));
    });

    machineSource.addEventListener("maintenance", (event) => {
      const data = JSON.parse(event.data);
      console.log("Maintenance notification:", JSON.stringify(data, null, 2));
      addNotification(data);
      maintenanceCallbacks.current.forEach((callback) => callback(data));
    });

    machineSource.onerror = (error) => {
      console.error("Machine EventSource error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <StreamContext.Provider
      value={{
        onUpdate,
        onUnauthorized,
        onMachine,
        onMaintenance,
        notificationHistory,
        addNotification,
        machines,
        machineStatuses,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

StreamProvider.displayName = "/src/context/StreamContext.jsx";