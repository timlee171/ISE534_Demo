import React, { useState, useCallback, useEffect, useContext } from "react";
import {
  Typography,
} from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import {
  statisticsCardsData,
  statisticsChartsData
} from "@/data";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import MapView from "@/components/MapView";
import { StreamContext } from "@/context/StreamContext";



export function Home() {
  const { onUpdate, onUnauthorized } = useContext(StreamContext);
  const [devices, setDevices] = useState([]);

  const handleUpdate = useCallback((data) => {
    const mac = data.mac_address;
    const location = data.location;
    const timestamp = data.timestamp;
    const authorized = data.authorized;

    setDevices((prevDevices) => {
      const existingDevice = prevDevices.find((d) => d.mac_address === mac);
      if (existingDevice) {
        return prevDevices.map((d) =>
          d.mac_address === mac
            ? { ...d, location, timestamp, authorized }
            : d
        );
      }
      return [
        ...prevDevices,
        { mac_address: mac, location, timestamp, authorized },
      ];
    });
  }, []);

  const handleUnauthorized = useCallback((unauthorized) => {
    const mac = unauthorized.mac_address;
    const location = unauthorized.location;
    const timestamp = unauthorized.timestamp;
    const authorized = unauthorized.authorized;

    setDevices((prevDevices) => {
      const existingDevice = prevDevices.find((d) => d.mac_address === mac);
      if (existingDevice) {
        return prevDevices.map((d) =>
          d.mac_address === mac
            ? { ...d, location, timestamp, authorized }
            : d
        );
      }
      return [
        ...prevDevices,
        { mac_address: mac, location, timestamp, authorized },
      ];
    });
  }, []);

  // Fetch historical device records
  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch devices");
        }
        return res.json();
      })
      .then((data) => {
        setDevices(data);
        console.log("Fetched historical devices:", data);
      })
      .catch((error) => {
        console.error("Error fetching devices:", error);
      });
  }, []);

  useEffect(() => {
    console.log("Home subscribing to stream events");
    onUpdate(handleUpdate);
    onUnauthorized(handleUnauthorized);
  }, [onUpdate, onUnauthorized, handleUpdate, handleUnauthorized]);

  useEffect(() => {
    console.log("Current devices:", devices);
  }, [devices]);



  return (
    <div className="mt-12">
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {statisticsCardsData.map(({ icon, title, footer, ...rest }) => (
          <StatisticsCard
            key={title}
            {...rest}
            title={title}
            icon={React.createElement(icon, {
              className: "w-6 h-6 text-white",
            })}
            footer={
              <Typography className="font-normal text-blue-gray-600">
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </Typography>
            }
          />
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
        {statisticsChartsData.map((props) => (
          <StatisticsChart
            key={props.title}
            {...props}
            footer={
              <Typography
                variant="small"
                className="flex items-center font-normal text-blue-gray-600"
              >
                <ClockIcon strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                &nbsp;{props.footer}
              </Typography>
            }
          />
        ))}
      </div>
      <div className="mb-4">
        <Typography variant="h5" className="mb-2">
          Device Locations
        </Typography>
        <div className="w-full h-[500px]">
          <MapView devices={devices} />
        </div>
      </div>
    </div>
  );
}
Home.displayName = "/src/pages/dashboard/home.jsx";

export default Home;
