# ISE534_Demo
 
# Backend (Flask)

## Requirement 
1. install following Python packages:

```pip install flask flask-cors```

## API ports
**@app.route("/stream")**
- Handle the logic of reading sample data from the data folder and streaming to the frontend
- Sending **MAC address**, **Location (Lng, Lat)**, **Timestamp (no neccessary)**

**Playload**: a dictionary to extract information and also checks whether the MAC address is in the **AUTHORIZED_MACS**

**Logic**

If MAC address is not **unauthroized**, event type is set to **unauthorized**

If MAC address is **authorized**, event type is set to **update**

**@app.route("/device")**
- Use GET HTTP request to readf sample data and streaming the data information to frontend
- Send Record with **MAC address**, **Longitude**, **Latitude**, and locationtime (not neccessary)
- **For updating the MAC address location and display on map**



# Frontend (React)


