import React, { useEffect, useState, useCallback, useContext } from "react";
import { Typography } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import { statisticsCardsData, statisticsChartsData } from "@/data";
import { ClockIcon } from "@heroicons/react/24/solid";
import MapView from "@/components/MapView";
import { StreamContext } from "@/context/StreamContext";

export function Home() {
  const { onUpdate, onUnauthorized } = useContext(StreamContext);
  const [devices, setDevices] = useState({}); // Store devices as { mac_address: latest_record }

  const updateDevice = useCallback((data) => {
    const mac = data.mac_address;
    const location = data.location;
    const timestamp = data.timestamp;
    const authorized = data.authorized;

    setDevices((prevDevices) => ({
      ...prevDevices,
      [mac]: { mac_address: mac, location, timestamp, authorized },
    }));
  }, []);

  const handleUpdate = useCallback((data) => {
    updateDevice(data);
  }, [updateDevice]);

  const handleUnauthorized = useCallback((unauthorized) => {
    updateDevice(unauthorized);
  }, [updateDevice]);

  useEffect(() => {
    console.log("Home subscribing to stream events");
    onUpdate(handleUpdate);
    onUnauthorized(handleUnauthorized);
  }, [onUpdate, onUnauthorized, handleUpdate, handleUnauthorized]);

  useEffect(() => {
    console.log("Current devices:", Object.values(devices));
  }, [devices]);

  // Log the devices prop passed to MapView
  useEffect(() => {
    console.log("Devices passed to MapView:", Object.values(devices));
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
                 {footer.label}
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
                 {props.footer}
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
          <MapView devices={Object.values(devices)} />
        </div>
      </div>
    </div>
  );
}

Home.displayName = "/src/pages/dashboard/home.jsx";

export default Home;