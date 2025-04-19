import React, { createContext, useEffect, useCallback } from "react";
import { connectToStream, closeStream } from "@/utils/stream";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const listeners = {
    update: [],
    unauthorized: [],
  };

  const addUpdateListener = (listener) => {
    listeners.update.push(listener);
  };

  const addUnauthorizedListener = (listener) => {
    listeners.unauthorized.push(listener);
  };

  const handleUpdate = useCallback((data) => {
    console.log("Stream update:", data);
    listeners.update.forEach((listener) => listener(data));
  }, []);

  const handleUnauthorized = useCallback((data) => {
    console.warn("Stream unauthorized:", data);
    listeners.unauthorized.forEach((listener) => listener(data));
  }, []);

  const handleError = useCallback((error) => {
    console.error("Stream error:", error);
  }, []);

  useEffect(() => {
    console.log("StreamProvider initializing EventSource.");
    const stream = connectToStream(handleUpdate, handleUnauthorized, handleError);

    return () => {
      console.log("StreamProvider cleaning up EventSource.");
      closeStream();
    };
  }, [handleUpdate, handleUnauthorized, handleError]);

  return (
    <StreamContext.Provider
      value={{
        onUpdate: addUpdateListener,
        onUnauthorized: addUnauthorizedListener,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};