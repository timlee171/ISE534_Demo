import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import time
from sklearn.preprocessing import LabelEncoder
from sklearn.utils import shuffle
import  json

features_col = ['time_in_cycles', 'voltmean_24h', 'rotatemean_24h', 'pressuremean_24h',
 'vibrationmean_24h', 'voltsd_24h', 'rotatesd_24h', 'pressuresd_24h',
 'vibrationsd_24h', 'voltmean_5d', 'rotatemean_5d', 'pressuremean_5d',
 'vibrationmean_5d', 'voltsd_5d', 'rotatesd_5d', 'pressuresd_5d',
 'vibrationsd_5d', 'error1', 'error2', 'error3', 'error4', 'error5', 'comp1',
 'comp2', 'comp3', 'comp4', 'age', 'model_encoded', 'DI']

MACHINE_INFO = [{"machine_id": 49, "mac_address": "28:3a:4d:31:a1:8d", "lat": "51.460684", "lng": "-0.932335", "floor_name": "Ground Floor", "name":"Lithography Systems", "company": "SamSung"},
                {"machine_id": 45, "mac_address": "00:80:92:df:7b:97", "lat": "51.460355", "lng": "-0.932523", "floor_name": "Ground Floor", "name":"Clean Room Equipment", "company": "SamSung"},
                {"machine_id": 41, "mac_address": "9c:b6:d0:bc:4b:c1", "lat": "51.460499", "lng": "-0.933075", "floor_name": "Ground Floor", "name":"Lithography System-1", "company": "Nividia"},
                {"machine_id": 37, "mac_address": "fc:45:96:12:d1:4b", "lat": "51.460904", "lng": "-0.932329", "floor_name": "Ground Floor", "name":"Clean Room Equipment", "company": "Apple"},
                {"machine_id": 64, "mac_address": "00:0b:82:d0:ff:35", "lat": "51.460366", "lng": "-0.932544", "floor_name": "1st Floor", "name":"Lithography System-2", "company": "SamSung"}]

def encode_model_column(data):
    label_encoder = LabelEncoder()
    # Fit and transform the 'model' column
    data['model_encoded'] = label_encoder.fit_transform(data['model'])
    return data



def predict_rui(data, model, features_col):
    input_array = np.array([[data[col] for col in features_col]])
    prediction = model.predict(input_array)
    print(prediction)
    return prediction

def stream():
    with open("../data/sample_rul.json", 'r') as f:
        data = json.load(f)
        # rul_model = joblib.load("../model/xgboost_model.pkl")
        total_records = len(data)
        duration = 180
        sleep_time = duration / total_records
        valid_machine_ids = {str(machine["machine_id"]) for machine in MACHINE_INFO}
        filtered_data = [row for row in data if row.get("machineID") in valid_machine_ids]
        with open("../data/filtered_sample_rul.json", "w") as f:
                json.dump(filtered_data, f, indent=2)
        # for row in filtered_data:
        #     time.sleep(sleep_time)
            # prediction = predict_rui(row, rul_model, features_col)
            # print(f" prediction: {prediction}")

def filter_data():
    data = pd.read_csv("../data/sample_rul.csv")
    valid_ids = [49, 45, 41, 37, 64]
    filter_data = data[data["machineID"].isin(valid_ids)]
    le = LabelEncoder()
    filter_data["model_encoded"] = le.fit_transform(filter_data["model"])
    filter_data.drop(columns=["model"], inplace=True)
    # shuffled_data = filter_data.sample(frac=1).reset_index(drop=True)
    # shuffled_data.to_json("../data/filtered_sample_rul.json", orient="records", indent=2)
          
          

def main():
    # stream()
    filter_data()


# if __name__ == "__main__":
#     main()

data = pd.read_csv("../data/sample_rul.csv")
valid_ids = [49, 45, 41, 37, 64]
filter_data = data[data["machineID"].isin(valid_ids)].copy()

le = LabelEncoder()
filter_data["model_encoded"] = le.fit_transform(filter_data["model"])
filter_data.drop(columns=["model"], inplace=True)
filter_data.sort_values(by=["machineID", "time_in_cycles"], inplace=True)

# Assign a row index per machine (cycle count index)
filter_data["row_index"] = filter_data.groupby("machineID").cumcount()

# Reorder: sort by row_index first, then machineID to interleave
df_interleaved = filter_data.sort_values(by=["row_index", "machineID"]).reset_index(drop=True)

# Optional: drop row_index if no longer needed
df_interleaved.drop(columns=["row_index"], inplace=True)

print(df_interleaved.head(3))

df_interleaved.to_json("../data/filtered_sample_rul.json", orient="records", indent = 2)