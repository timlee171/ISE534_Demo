import React, { createContext, useEffect, useState, useRef } from "react";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const updateCallbacks = useRef([]);
  const unauthorizedCallbacks = useRef([]);

  const [notificationHistory, setNotificationHistory] = useState([]);

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

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <StreamContext.Provider
      value={{
        onUpdate,
        onUnauthorized,
        notificationHistory,
        addNotification,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

StreamProvider.displayName = "/src/context/StreamContext.jsx";