from flask import Flask, Response, stream_with_context, jsonify, request
from flask_cors import CORS
import json
import time
import datetime 
import joblib
import numpy as np
import pandas as pd
import logging


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}})


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load the pre-trained ML model for RUL prediction
try:
    rul_model = joblib.load("../model/xgboost_model.pkl")
    logger.info("Model loaded successfully: %s", rul_model)
except FileNotFoundError:
    logger.error("RUL model file not found at ../model/xgboost_model.pkl")
    rul_model = None
except Exception as e:
    logger.error("Error loading model: %s", e)
    rul_model = None
RUL_THRESHOLD = 24

BREAKDOWN_THRESHOLD = 5

AUTHORIZED_MACS = {'84:a1:34:e6:68:67', '1c:5c:f2:e0:d1:cf', '9c:da:3e:7e:f7:d4',
       '88:66:a5:1e:b0:b2', '38:00:25:6c:3f:09', '98:10:e8:06:85:6a',
       '7c:b2:7d:87:5c:cb', '88:66:a5:55:76:c6', '88:66:a5:14:63:be',
       '5c:5f:67:8b:e1:47', '9c:da:3e:7f:8e:24', 'a4:c3:f0:a5:f1:2c', 'cc:44:63:15:fa:5e', '90:61:ae:25:a1:de', '7c:b2:7d:87:58:93'}
TEMP_AUTHORIZED_MACS = set()

MACHINE_INFO = [{"machine_id": 49, "mac_address": "28:3a:4d:31:a1:8d", "lat": "51.460684", "lng": "-0.932335", "floor_name": "Ground Floor", "name":"Lithography Systems", "company": "Apple", "role": "machine"},
                {"machine_id": 45, "mac_address": "00:80:92:df:7b:97", "lat": "51.460355", "lng": "-0.932523", "floor_name": "Ground Floor", "name":"Clean Room Equipment", "company": "Samsung", "role": "machine"},
                {"machine_id": 41, "mac_address": "9c:b6:d0:bc:4b:c1", "lat": "51.460499", "lng": "-0.933075", "floor_name": "Ground Floor", "name":"Lithography System-1", "company": "Nvidia", "role": "machine"},
                {"machine_id": 37, "mac_address": "fc:45:96:12:d1:4b", "lat": "51.460904", "lng": "-0.932329", "floor_name": "Ground Floor", "name":"Clean Room Equipment", "company": "Apple", "role": "machine"},
                {"machine_id": 64, "mac_address": "00:0b:82:d0:ff:35", "lat": "51.460366", "lng": "-0.932544", "floor_name": "1st Floor", "name":"Lithography System-2", "company": "Samsung", "role": "machine"}]

employee_table = [{"name": "Tim","company": "Apple", "role": "staff", "level": "ground", "mac_address": "9c:da:3e:7f:8e:24"},
                   {"name": "Nick","company": "Samsung", "role": "mechanic", "level": "ground", "mac_address": "88:66:a5:14:63:be"},
                   {"name": "Sanjana","company": "Nvidia", "role": "mechanic", "level": "ground", "mac_address": "84:a1:34:e6:68:67"},
                   {"name": "Aaryan","company": "Apple", "role": "mechanic", "level": "ground", "mac_address": "38:00:25:6c:3f:09"},
                   {"name": "Sib","company": "Samsung", "role": "mechanic", "level": "ground", "mac_address": "7c:b2:7d:87:58:93"}]


DEVICE_INFO = [
    {
        "mac_address": emp["mac_address"],
        "company": emp["company"],
        "role": emp["role"],
        "level": emp["level"],
        "name": emp["name"]
    }
    for emp in employee_table
] + [
    {
        "mac_address": m["mac_address"],
        "company": m["company"],
        "role": "machine",
        "level": m["floor_name"],
        "name": m["name"],
    }
    for m in MACHINE_INFO
]

features_col = ['time_in_cycles', 'voltmean_24h', 'rotatemean_24h', 'pressuremean_24h',
 'vibrationmean_24h', 'voltsd_24h', 'rotatesd_24h', 'pressuresd_24h',
 'vibrationsd_24h', 'voltmean_5d', 'rotatemean_5d', 'pressuremean_5d',
 'vibrationmean_5d', 'voltsd_5d', 'rotatesd_5d', 'pressuresd_5d',
 'vibrationsd_5d', 'error1', 'error2', 'error3', 'error4', 'error5', 'comp1',
 'comp2', 'comp3', 'comp4', 'age', 'model_encoded', 'DI']

NVIDIA_LNG = -0.9328
APPLE_LAT = 51.46051109286201


def get_zone_company(lat, lng):
    if lng < NVIDIA_LNG:
        return "Nvidia"
    if lat > APPLE_LAT:
        return "Apple"
    return "Samsung"

@app.route("/stream/rtls")
def stream():
    def event_stream():
        try: 
            with open("../data/sample_data.json", "r") as file:
                data = json.load(file)
                total_records = len(data)
                duration = 180
                sleep_time = duration / total_records
                for row in data:
                    
                    time.sleep(sleep_time)

                    mac = row.get("ClientMacAddr")
                    location = [row.get("lat"), row.get("lng")]

                    employee = next((e for e in employee_table if e["mac_address"] == mac), None)
                    if not employee:
                        logger.warning("No employee info found for mac_address %s", mac)
                        continue

                    # Check for zone violations
                    zone_company = get_zone_company(location[0], location[1])
                    if employee["company"] != zone_company:
                        payload = {
                            "mac_address": mac,
                            "name": employee["name"],
                            "company": employee["company"],
                            "role": employee["role"],
                            "zone_company": zone_company,
                            "location": location,
                            "timestamp": datetime.datetime.utcnow().isoformat()
                        }
                        logger.info("Zone violation: %s", payload)
                        yield f"event: zone_violation\ndata: {json.dumps(payload)}\n\n"
                    payload = {
                        "mac_address": mac,
                        "location": location,
                        "company": employee["company"],
                        "role": employee["role"],
                        "level": employee["level"],
                        "name": employee["name"],
                        "timestamp": datetime.datetime.utcnow().isoformat()
                    }
                    logger.info("RTLS payload: %s", payload)
                    yield f"event: update\ndata: {json.dumps(payload)}\n\n"
        except FileNotFoundError:
            logger.error("sample_data.json not found")
            yield f"event: error\ndata: {{'message': 'sample_data.json not found'}}\n\n"
        except json.JSONDecodeError:
            logger.error("Invalid JSON in sample_data.json")
            yield f"event: error\ndata: {{'message': 'Invalid JSON in sample_data.json'}}\n\n"
        except Exception as e:
            logger.error("RTLS stream error: %s", e)
            yield f"event: error\ndata: {{'message': 'RTLS stream error'}}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route("/stream/machine")
def stream_machine():
    def predict_rul(data, model, features_col):
        try:
            input_array = np.array([[data[col] for col in features_col]])
            predicted_rul = model.predict(input_array)[0]
            return max(predicted_rul, 0)
        except Exception as e:
            logger.error("RUL prediction error: %s", e)
            return None
    
    def infer_failure_reason(row):
        errors = ['error1', 'error2', 'error3', 'error4', 'error5']
        active_errors = [err for err in errors if err in row and row[err] > 0]
        if active_errors:
            return f"Error codes: {', '.join(active_errors)}"

        comps = ['comp1', 'comp2', 'comp3', 'comp4']
        active_comps = [comp for comp in comps if comp in row and row[comp] > 0]
        if active_comps:
            return f"Maintenance on: {', '.join([c.replace('comp', 'component ') for c in active_comps])}"

        if 'vibrationmean_24h' in row and row['vibrationmean_24h'] > 45:
            return "High vibration"
        if 'voltmean_24h' in row and row['voltmean_24h'] > 180:
            return "High voltage"
        if 'pressuremean_24h' in row and row['pressuremean_24h'] > 110:
            return "High pressure"
        if 'rotatemean_24h' in row and row['rotatemean_24h'] > 500:
            return "High rotation speed"
        return "Unknown or general wear"

    def event_stream():
        try:
            with open("../data/filtered_sample_rul.json", "r") as file:
                data = json.load(file)
                total_records = len(data)
                duration = 180
                sleep_time = duration / total_records

                for row in data:
                    time.sleep(sleep_time)
                    machine_id = row.get("machineID")

                    # Find matching machine in MACHINE_INFO
                    if not machine_id:
                        logger.warning("Missing machine_id in sample_rul.json row: %s", row)
                        continue

                    machine = next((m for m in MACHINE_INFO if m["machine_id"] == machine_id), None)
                    if not machine:
                        logger.warning("No machine found for machine_id %s", machine_id)
                        continue

                    rul = None
                    status = "Good"
                    maintenance_alert = False
                    reason_to_failure = infer_failure_reason(row)
                    if rul_model and all(col in row for col in features_col):
                        rul = predict_rul(row, rul_model, features_col)
                        if rul <= BREAKDOWN_THRESHOLD:
                            status = "Breakdown"
                            maintenance_alert = True
                        elif rul < RUL_THRESHOLD:
                            status = "Warning"
                            maintenance_alert = True
                        else:
                            status = "Good"

                    # Machine status payload
                    payload = {
                        "machine_id": machine_id,
                        "mac_address": machine["mac_address"],
                        "name": machine["name"],
                        "company": machine["company"],
                        "floor_name": machine["floor_name"],
                        "location": [float(machine["lat"]), float(machine["lng"])],
                        "rul": float(rul) if rul is not None else None,
                        "status": status,
                        "timestamp": datetime.datetime.utcnow().isoformat()
                    }

                    print(f"Machine log: {payload}")
                    yield f"event: machine\ndata: {json.dumps(payload)}\n\n"

                    # Maintenance alert
                    if maintenance_alert:
                        maintenance_payload = {
                            "type": "maintenance",
                            "name": machine["name"],
                            "company": machine["company"],
                            "rul": float(rul) if rul is not None else None,
                            "status": status,
                            "floor_name": machine["floor_name"],
                            "message": f"Maintenance required: {status} (RUL {rul:.2f} hours)",
                            "predicted_failure_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=float(rul))).isoformat(),
                            "reason_to_failure": reason_to_failure
                        }
                        print(f"Maintenance notification: {maintenance_payload}")
                        yield f"event: maintenance\ndata: {json.dumps(maintenance_payload)}\n\n"
        except FileNotFoundError:
            logger.error("sample_rul.json not found")
            yield f"event: error\ndata: {{'message': 'sample_rul.json not found'}}\n\n"
        except json.JSONDecodeError:
            logger.error("Invalid JSON in sample_rul.json")
            yield f"event: error\ndata: {{'message': 'Invalid JSON in sample_rul.json'}}\n\n"
        except Exception as e:
            logger.error("Machine stream error: %s", e)
            yield f"event: error\ndata: {{'message': 'Machine stream error'}}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route("/machines", methods=["GET"])
def get_machines():
    return jsonify(MACHINE_INFO)


@app.route("/devices", methods=["GET"])
def get_devices():
    return jsonify(employee_table)

if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000)
