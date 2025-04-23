import React, { useEffect, useState, useContext, useMemo } from "react";
import { Typography } from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import { statisticsChartsData } from "@/data";
import {
  UsersIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { ClockIcon } from "@heroicons/react/24/solid";
import MapView from "@/components/MapView";
import { StreamContext } from "@/context/StreamContext";

export function Home() {
  const { rtlsData, machines, employees } = useContext(StreamContext);
  const [devices, setDevices] = useState(() => {
    if (!sessionStorage.getItem("hasClearedDeviceHistory")) {
      localStorage.removeItem("deviceHistory");
      sessionStorage.setItem("hasClearedDeviceHistory", "true");
    }
    const stored = JSON.parse(localStorage.getItem("deviceHistory")) || {};
    return stored;
  });

  useEffect(() => {
    localStorage.setItem("deviceHistory", JSON.stringify(devices));
  }, [devices]);

  // Update devices from machines and employees
  useEffect(() => {
    console.log("rtlsData in Home:", rtlsData);
    console.log("machines in Home:", machines);
    console.log("employees in Home:", employees);

    setDevices((prevDevices) => {
      const newDevices = { ...prevDevices };

      // Process static machine data
      machines.forEach((machine) => {
        newDevices[machine.mac_address] = {
          mac_address: machine.mac_address,
          location: [parseFloat(machine.lat), parseFloat(machine.lng)],
          company: machine.company,
          role: machine.role,
          name: machine.name,
          level: machine.floor_name,
          authorized: true,
          source: "machine",
        };
      });

      // Process employee data
      employees.forEach((employee) => {
        const rtls = rtlsData[employee.mac_address] || {};
        const location =
          rtls.location &&
          Array.isArray(rtls.location) &&
          rtls.location.length === 2 &&
          typeof rtls.location[0] === "number" &&
          typeof rtls.location[1] === "number"
            ? rtls.location
            : [51.4606, -0.9325]; // Fallback location
        if (!rtls.location) {
          console.warn(`No RTLS location for employee: ${employee.mac_address}`);
        }
        newDevices[employee.mac_address] = {
          mac_address: employee.mac_address,
          location,
          company: employee.company,
          role: employee.role,
          name: employee.name,
          level: employee.level,
          timestamp: rtls.timestamp,
          authorized: true,
          source: "employee",
        };
      });

      console.log("Devices in Home:", Object.values(newDevices));
      return newDevices;
    });
  }, [rtlsData, machines, employees]);

  // Compute employee and visitor counts
  const employeeCount = useMemo(
    () =>
      Object.values(devices).filter(
        (device) => device.authorized && device.source === "employee"
      ).length,
    [devices]
  );
  const visitorCount = useMemo(
    () =>
      Object.values(devices).filter(
        (device) => device.authorized && device.source === "visitor"
      ).length,
    [devices]
  );

  // Dynamic statistics cards data
  const statisticsCardsData = [
    {
      color: "gray",
      icon: UsersIcon,
      title: "Employee",
      value: employeeCount.toString(),
      footer: {
        color: "text-green-500",
        value: "+2%",
        label: "than last week",
      },
    },
    {
      color: "gray",
      icon: UserCircleIcon,
      title: "Visitors",
      value: visitorCount.toString(),
      footer: {
        color: "text-green-500",
        value: "+3%",
        label: "than last month",
      },
    },
    {
      color: "gray",
      icon: ExclamationCircleIcon,
      title: "Errors",
      value: "2",
      footer: {
        color: "text-red-500",
        value: "-2%",
        label: "than yesterday",
      },
    },
    {
      color: "gray",
      icon: WrenchScrewdriverIcon,
      title: "Unsolved Tasks",
      value: "3",
      footer: {
        color: "text-green-500",
        value: "+5%",
        label: "than yesterday",
      },
    },
  ];

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
          <MapView devices={Object.values(devices)} />
        </div>
      </div>
    </div>
  );
}

Home.displayName = "/src/pages/dashboard/home.jsx";

export default Home;