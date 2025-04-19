import React, { createContext, useEffect, useRef } from "react";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const updateCallbacks = useRef([]);
  const unauthorizedCallbacks = useRef([]);

  const onUpdate = (callback) => {
    updateCallbacks.current.push(callback);
  };

  const onUnauthorized = (callback) => {
    unauthorizedCallbacks.current.push(callback);
  };

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/stream");

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
    <StreamContext.Provider value={{ onUpdate, onUnauthorized }}>
      {children}
    </StreamContext.Provider>
  );
};

StreamProvider.displayName = "/src/context/StreamContext.jsx";