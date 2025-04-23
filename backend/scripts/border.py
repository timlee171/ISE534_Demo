import pandas as pd
import matplotlib.pyplot as plt
from shapely.geometry import Point, Polygon
from google.cloud import storage
import io
from google.colab import auth

# Authenticate with GCP
auth.authenticate_user()

# Initialize GCS client
client = storage.Client()

# Configuration
BUCKET_NAME = "ise534"
FOLDER = "stationary/"
mac_addresses = [

"00:0e:8e:5e:5e:d9", "00:60:1d:d5:9d:a6", "00:c2:c6:06:95:78", "04:d3:b0:8f:15:ba", "04:d6:aa:0b:af:87",
"04:d6:aa:ae:ea:c0", "04:d6:aa:c0:45:a2", "08:3d:88:0d:28:c6", "08:c5:e1:39:ed:e6", "08:c5:e1:90:38:e5",
"14:9f:3c:0f:c1:e3", "1c:99:4c:62:de:f2", "28:24:ff:55:df:2b", "28:3a:4d:31:e2:63", "2c:0e:3d:05:08:20",
"2c:0e:3d:c3:aa:71", "30:07:4d:77:2b:23", "34:f6:4b:20:70:c4", "40:06:a0:d8:51:61", "40:e2:30:f2:0a:0f",
"44:65:0d:8c:8b:f5", "44:91:60:5a:a0:fb", "48:51:b7:55:2d:b9", "48:89:e7:65:26:d3", "4c:34:88:25:4c:48",
"4c:66:41:3f:88:c9", "4c:66:41:fc:3a:47", "4c:dd:31:9d:30:63", "4c:dd:31:a5:14:4a", "50:e0:85:4b:b9:10"


]

# Building boundary polygon
boundary_coords = [
 (-0.9325257491440092, 51.46095209556677),
 (-0.9322260122943579, 51.4609303706827),
 (-0.9323480528003849, 51.46025271621235),
 (-0.9328194510225436, 51.4602853040184),
 (-0.9328100632912344, 51.460345466060794),
 (-0.9332976202566329, 51.46038074214056),
 (-0.9332654337484021, 51.460556631967684),
 (-0.9326062808918492, 51.46051109286201),
]
boundary_polygon = Polygon(boundary_coords)


# 
# Plot setup
plt.figure(figsize=(10, 6))

# Plot the building boundary
x, y = boundary_polygon.exterior.xy
plt.plot(x, y, color='black', linestyle='--', linewidth=2, label='Building Boundary')

# Define region boundaries
NVIDIA_LNG = -0.9328
APPLE_LAT = 51.46051109286201
records=[]
# Read and classify each point
for mac in mac_addresses:
 blob_path = f"{FOLDER}{mac}.csv" # Use the correct path for each MAC address
 blob = client.bucket(BUCKET_NAME).blob(blob_path)
 
 if blob.exists():
 data = pd.read_csv(io.BytesIO(blob.download_as_bytes()))
 
 if not data.empty:
 first_row = data.iloc[0]
 lng = first_row["lng"]
 lat = first_row["lat"]
 level = first_row["Level"].strip().lower() # Ensure no extra spaces in "Level"
 point = Point(lng, lat)

 if level == "3rd floor" and boundary_polygon.contains(point): # Ensure level matches
 if lng <= NVIDIA_LNG:
 brand = "NVIDIA"
 plt.scatter(lng, lat, color="blue", s=60)
 elif lat >= APPLE_LAT:
 brand = "APPLE"
 plt.scatter(lng, lat, color="green", s=60)
 else:
 plt.scatter(lng, lat, color="red", s=60)
 brand = "samsung_electronics"

 records.append({
 "MacID": mac,
 "Latitude": lat,
 "Longitude": lng,
 "Floor": "First Floor",
 "Brand": brand
 })

# Formatting the plot
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.title("third Floor Stationary Devices by Region")
plt.grid(True)
plt.show()
df = pd.DataFrame(records)
df_output = df[['MacID', 'Latitude', 'Longitude', 'Floor', 'Brand']]

# Print as table
print(df_output.to_string(index=False))

# csv_filename = "third_floor_classified_devices.csv"
# df.to_csv(csv_filename, index=False)

# # Download if in Google Colab
# files.download(csv_filename)