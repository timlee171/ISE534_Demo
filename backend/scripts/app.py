from flask import Flask, Response, stream_with_context, jsonify, request
from flask_cors import CORS
import json
import time

app = Flask(__name__)
CORS(app)

AUTHORIZED_MACS = {'84:a1:34:e6:68:67', '1c:5c:f2:e0:d1:cf', '9c:da:3e:7e:f7:d4',
       '88:66:a5:1e:b0:b2', '38:00:25:6c:3f:09', '98:10:e8:06:85:6a',
       '7c:b2:7d:87:5c:cb', '88:66:a5:55:76:c6', '88:66:a5:14:63:be',
       '5c:5f:67:8b:e1:47', '9c:da:3e:7f:8e:24', 'a4:c3:f0:a5:f1:2c'}
TEMP_AUTHORIZED_MACS = set()


@app.route("/stream")
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



if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000)
