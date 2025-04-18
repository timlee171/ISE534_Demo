let eventSourceInstance = null;

export const connectToStream = (onUpdate, onUnauthorized, onError) => {
    if (eventSourceInstance) {
      console.log("Reusing existing EventSource connection.");
      return eventSourceInstance;
    }
    eventSourceInstance = new EventSource("http://localhost:5000/stream");
  
    eventSourceInstance.onopen = () => {
      console.log("Connection to server opened.");
    };
  
    eventSourceInstance.addEventListener("update", (event) => {
      const data = JSON.parse(event.data);
      console.log("Authorized device update:", data);
      onUpdate(data);
    });
  
    eventSourceInstance.addEventListener("unauthorized", (event) => {
      const data = JSON.parse(event.data);
      console.warn("⚠️ Unauthorized MAC detected:", data);
      onUnauthorized(data);
    });
  
    eventSourceInstance.onrror = (error) => {
      console.error("Stream error:", error);
      onError(error);
      eventSourceInstance.close();
      eventSourceInstance = null;
    };
  
    return eventSourceInstance;
  };
  

// Function to close the EventSource connection
export const closeStream = () => {
  if (eventSourceInstance) {
    eventSourceInstance.close();
    eventSourceInstance = null;
    console.log("EventSource connection closed.");
  }
};