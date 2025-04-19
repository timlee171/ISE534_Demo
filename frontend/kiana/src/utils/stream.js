let eventSourceInstance = null;
let isConnecting = false;

export const connectToStream = (onUpdate, onUnauthorized, onError) => {
    if (isConnecting) {
      console.log("Connection attempt in progress, waiting...");
      return eventSourceInstance;
    }
    if (eventSourceInstance) {
      console.log("Reusing existing EventSource connection.");
      return eventSourceInstance;
    }
    console.log("Creating new EventSource instance.");
    isConnecting = true;
    try {
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
    
      eventSourceInstance.onerror = (error) => {
        console.error("Stream error:", error);
        onError(error);
        eventSourceInstance.close();
        eventSourceInstance = null;
      };
      return eventSourceInstance;
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      isConnecting = false;
      eventSourceInstance = null;
      return null
    }
  };
  

// Function to close the EventSource connection
export const closeStream = () => {
  if (eventSourceInstance) {
    console.log("Closing EventSource connection.");
    eventSourceInstance.close();
    eventSourceInstance = null;
  }
  isConnecting = false;
};