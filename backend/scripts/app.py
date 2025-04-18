from flask import Flask, Response, stream_with_context
from flask_cors import CORS
import json
import time

app = Flask(__name__)
CORS(app)

AUTHORIZED_MACS = {'84:a1:34:e6:68:67', '1c:5c:f2:e0:d1:cf', '9c:da:3e:7e:f7:d4',
       '88:66:a5:1e:b0:b2', '38:00:25:6c:3f:09', '98:10:e8:06:85:6a',
       '7c:b2:7d:87:5c:cb', '88:66:a5:55:76:c6', '88:66:a5:14:63:be',
       '5c:5f:67:8b:e1:47', '9c:da:3e:7f:8e:24', 'a4:c3:f0:a5:f1:2c'}
visitor_list = {}

@app.route("/stream")
def stream():
    def event_stream():
        with open("../data/sample_data.json", "r") as file:
            data = json.load(file)
            total_records = len(data)
            duration = 180
            sleep_time = duration / total_records
            for row in data:
                # Simulate delay like real-time RTLS system
                time.sleep(sleep_time)

                mac = row.get("ClientMacAddr")
                location = (row.get("lat"), row.get("lng"))
                timestamp = row.get("localtime")

                payload = {
                "mac_address": mac,
                "location": location,
                "timestamp": timestamp
                }
                print(payload)
                if mac not in AUTHORIZED_MACS:
                    print(f"found visitors {mac}")
                    yield f"event: unauthorized\ndata: {json.dumps(payload)}\n\n"
                else:
                    yield f"event: update\ndata: {json.dumps(payload)}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000)
