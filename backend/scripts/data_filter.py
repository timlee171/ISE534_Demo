import json
import pandas as pd
import random
import numpy as np

# with open("../data/employee_machine_nearby_employee_locations_sample.json", "r") as file:
#     data = json.load(file)
#     for record in data:
#         record.pop("mac_address", None)
# random.shuffle(data)
# with open("../data/rtls.json", "w") as file:
#     json.dump(data, file, indent = 2)

# df = pd.read_json("../data/rtls.json")

# unique_macs = df["ClientMacAddr"].unique()

# unique_macs_list = unique_macs.tolist()
# print(unique_macs_list)

# df = pd.read_csv("../data/employee_mac_roles.csv")
# df['name'] = df['first_name'] + ' ' + df['last_name']

# # Drop the original first_name and last_name columns
# df = df.drop(['first_name', 'last_name'], axis=1)
# df["company"] = np.random.choice(["Apple", "Samsung", "Nvidia"], size=len(df))
# df["type"] = "employee"
# print(df.head(3))



# df.to_json("../data/employee_table.json", orient= "records", indent=2)

df = pd.read_json("../data/employee_all_technicians.json")
df.rename(columns={'employee_mac': 'ClientMacAddr'}, inplace=True)
df = df.sample(frac=1).reset_index(drop=True)
unique_ids = df['ClientMacAddr'].unique()
print(unique_ids)
ids = ["88:66:a5:8f:a7:85", "6c:96:cf:6d:18:79"]
df = df[~df['ClientMacAddr'].isin(ids)]
print(len(df))
# df.to_json('../data/rtls_1.json', orient='records', indent=2)


NVIDIA_LNG = -0.9328
APPLE_LAT = 51.46051109286201



employee_table = [{"name": "Tim", "company": "Apple", "role": "mechanic", "floor": "Ground Floor", "mac_address": "14:c2:13:93:ea:6b"},
                   {"name": "Nick", "company": "Samsung", "role": "mechanic", "floor": "Ground Floor", "mac_address": "44:80:eb:82:3d:b3"},
                   {"name": "Sanjana",  "company": "Nvidia", "role": "mechanic", "floor": "Ground Floor", "mac_address": "54:99:63:92:d0:f8"},
                   {"name": "Aaryan", "company": "Apple", "role": "mechanic", "floor": "Ground Floor", "mac_address": "00:b3:62:2a:87:01"},
                   {"name": "Sib", "company": "Samsung", "role": "mechanic", "floor": "Ground Floor", "mac_address": "f0:18:98:0a:01:a0"},
                   {"name": "Charles",  "company": "Nvidia", "role": "mechanic", "floor": "Ground Floor", "mac_address": "20:ee:28:e1:8a:a7"}]
def get_zone_company(lat, lng):
    if lng < NVIDIA_LNG:
        return "Nvidia"
    if lat > APPLE_LAT:
        return "Apple"
    return "Samsung"

mac_to_company = {e["mac_address"]: e["company"] for e in [
    {"name": "Tim", "company": "Apple", "role": "mechanic", "floor": "Ground Floor", "mac_address": "14:c2:13:93:ea:6b"},
    {"name": "Nick", "company": "Samsung", "role": "mechanic", "floor": "Ground Floor", "mac_address": "44:80:eb:82:3d:b3"},
    {"name": "Sanjana", "company": "Nvidia", "role": "mechanic", "floor": "Ground Floor", "mac_address": "54:99:63:92:d0:f8"},
    {"name": "Aaryan", "company": "Apple", "role": "mechanic", "floor": "Ground Floor", "mac_address": "00:b3:62:2a:87:01"},
    {"name": "Sib", "company": "Samsung", "role": "mechanic", "floor": "Ground Floor", "mac_address": "f0:18:98:0a:01:a0"},
    {"name": "Charles", "company": "Nvidia", "role": "mechanic", "floor": "Ground Floor", "mac_address": "20:ee:28:e1:8a:a7"}
]}

def is_wrong_zone(row):
    mac = row['ClientMacAddr']
    actual_zone = get_zone_company(row['lat'], row['lng'])
    expected_zone = mac_to_company.get(mac)
    return expected_zone is not None and actual_zone != expected_zone

wrong_zone_df = df[df.apply(is_wrong_zone, axis=1)]

# Get one record per employee (MAC address)
one_wrong_per_employee = wrong_zone_df.groupby('ClientMacAddr').first().reset_index()

# print(one_wrong_per_employee[['ClientMacAddr', 'lat', 'lng']])

correct_zone_df = df[~df.index.isin(wrong_zone_df.index)]

# Step 4: Combine and shuffle
final_df = pd.concat([correct_zone_df, one_wrong_per_employee], ignore_index=True)
final_df = final_df.sample(frac=1).reset_index(drop=True)
final_df.to_json("../data/rtls_2.json", orient='records', indent=2)

#   { 
#     "mac_address": "98:00:c6:44:13:cf",
#     "role": "mechanic", 
#     "floor": "Ground Floor",
#     "name": "Tim", 
#     "company": "Apple"
#   },
#   { 
#     "mac_address": "b4:9c:df:79:56:cb",
#     "role": "mechanic", 
#     "floor": "Ground Floor", 
#     "name": "Nick",
#     "company": "Samsung"
#   },
#   { 
#     "mac_address": "5c:f7:e6:e2:e3:82",
#     "role": "mechanic", 
#     "floor": "Ground Floor", 
#     "name": "Sanjana",
#     "company": "Nvidia"
    
#   },
#   { 
#     "mac_address": "04:69:f8:63:8e:12",
#     "role": "mechanic",
#     "floor": "Ground Floor", 
#     "name": "Aaryan",
#     "company": "Apple"
    
#   },
#   { 
#     "mac_address": "ec:ad:b8:7a:dc:9b",
#     "role": "mechanic",
#     "floor": "Ground Floor",
#     "name": "Sib", 
#     "company": "Samsung"
#   },
#   { 
#     "mac_address": "70:11:24:41:bd:31",
#     "role": "mechanic", 
#     "floor": "Ground Floor",
#     "name": "Charles", 
#     "company": "Apple"
#   }