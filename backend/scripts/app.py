from flask import Flask, Response, stream_with_context, jsonify, request
from flask_cors import CORS
import json
import time
import datetime 


app = Flask(__name__)
CORS(app)

# # Load the pre-trained ML model for RUL prediction
# try:
#     rul_model = joblib.load("../models/rul_model.pkl")
# except FileNotFoundError:
#     print("Error: RUL model file not found. Please provide a trained model.")
#     rul_model = None

RUL_THRESHOLD = 24

AUTHORIZED_MACS = {'84:a1:34:e6:68:67', '1c:5c:f2:e0:d1:cf', '9c:da:3e:7e:f7:d4',
       '88:66:a5:1e:b0:b2', '38:00:25:6c:3f:09', '98:10:e8:06:85:6a',
       '7c:b2:7d:87:5c:cb', '88:66:a5:55:76:c6', '88:66:a5:14:63:be',
       '5c:5f:67:8b:e1:47', '9c:da:3e:7f:8e:24', 'a4:c3:f0:a5:f1:2c'}
TEMP_AUTHORIZED_MACS = set()

MACHINE_INFO = [{"machine_id": 1, "mac_address": "00:0b:82:d0:ff:35", "lat": "51.4603668011321", "lng": "-0.932544301464585"},
                {"machine_id": 2, "mac_address": "00:80:92:df:7b:97", "lat": "51.4603558442931", "lng": "-0.932523457155923"},
                {"machine_id": 3, "mac_address": "28:3a:4d:31:e2:e5", "lat": "51.4605691396644", "lng": "-0.932353195942995"},
                {"machine_id": 4, "mac_address": "28:3a:4d:31:a1:8d", "lat": "51.4606842233795", "lng": "-0.932335489033781"},
                {"machine_id": 5, "mac_address": "64:6e:69:d9:fc:8b", "lat": "51.4603852218533", "lng": "-0.932597763643519"}]


@app.route("/stream/rtls")
def stream():
    def event_stream():
        with open("../data/sample_data.json", "r") as file:
            data = json.load(file)
            total_records = len(data)
            duration = 180
            sleep_time = duration / total_records
            for row in data:
                
                time.sleep(sleep_time)

                mac = row.get("ClientMacAddr")
                location = [row.get("lat"), row.get("lng")]

                # Determine status
                if mac in AUTHORIZED_MACS:
                    authorized = True,
                    source = "employee"
                    event_type = "update"
                elif mac in TEMP_AUTHORIZED_MACS:
                    authorized = True,
                    source = "visitor"
                    event_type = "update"
                else:
                    authorized = False,
                    source = None
                    event_type = "unauthorized"
                
                payload = {
                "mac_address": mac,
                "location": location,
                "authorized": authorized,
                "source": source
                }
                print(payload)
                if event_type == "unauthorized":
                        print(f"Found unauthorized device: {mac}")
                yield f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route("/temp-auth", methods=["POST"])
def add_temp_auth():
    data = request.get_json()
    mac = data.get("mac_address")
    if not mac:
        return jsonify({"error": "MAC address required"}), 400
    TEMP_AUTHORIZED_MACS.add(mac.lower())
    return jsonify({"message": f"MAC {mac} added to temporary authorization list"}), 200

@app.route("/temp-auth/<mac>", methods=["DELETE"])
def remove_temp_auth(mac):
    mac = mac.lower()
    if mac in TEMP_AUTHORIZED_MACS:
        TEMP_AUTHORIZED_MACS.remove(mac)
        return jsonify({"message": f"MAC {mac} removed from temporary authorization list"}), 200
    return jsonify({"error": f"MAC {mac} not found in temporary authorization list"}), 404

@app.route("/temp-auth", methods=["GET"])
def get_temp_auth():
    return jsonify(list(TEMP_AUTHORIZED_MACS))

@app.route("/stream/machine")
def stream_machine():
    def event_stream():
        with open("../data/machine_data.json", "r") as file:
            data = json.load(file)
            total_records = len(data)
            duration = 180  # Stream duration in seconds
            sleep_time = duration / total_records

            for row in data:
                time.sleep(sleep_time)

                mac = row.get("mac_address")
                sensor_data = {
                    "temperature": row.get("temperature", 0),
                    "pressure": row.get("pressure", 0),
                    "vibration": row.get("vibration", 0)
                }

                # Predict RUL
                rul = None
                maintenance_alert = False
                if rul_model and all(key in sensor_data for key in ["temperature", "pressure", "vibration"]):
                    try:
                        features = np.array([[sensor_data["temperature"], sensor_data["pressure"], sensor_data["vibration"]]])
                        rul = rul_model.predict(features)[0]
                        if rul < RUL_THRESHOLD:
                            maintenance_alertKwargs = True
                            maintenance_alert = True
                    except Exception as e:
                        print(f"Error predicting RUL: {e}")

                # Machine log payload
                payload = {
                    "mac_address": mac,
                    "sensor_data": sensor_data,
                    "rul": float(rul) if rul is not None else None
                }

                print(f"Machine log: {payload}")
                yield f"event: machine\ndata: {json.dumps(payload)}\n\n"

                # Maintenance alert
                if maintenance_alert:
                    maintenance_payload = {
                        "mac_address": mac,
                        "rul": float(rul),
                        "message": f"Maintenance required: RUL {rul:.2f} hours",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    print(f"Maintenance alert: {maintenance_payload}")
                    yield f"event: maintenance\ndata: {json.dumps(maintenance_payload)}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route("/machines", methods=["GET"])
def get_machines():
    return jsonify(MACHINE_INFO)

if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000)
