import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab
} from "@material-tailwind/react";
import { StreamContext } from "@/context/StreamContext";

export function Employees() {
  const { rtlsData } = useContext(StreamContext);
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  // Fetch DEVICE_INFO
  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then((response) => response.json())
      .then((data) => setDevices(data))
      .catch((error) => console.error("Error fetching devices:", error));
  }, []);

 // Filter employees (exclude machines) and by company
 const employees = devices.filter((device) => device.role === "mechanic" || device.role === "staff");
 const filteredEmployees = activeTab === "All"
   ? employees
   : employees.filter((employee) => employee.company === activeTab);

 const tabs = [
   { label: "All", value: "All" },
   { label: "Apple", value: "Apple" },
   { label: "Nvidia", value: "Nvidia" },
   { label: "Samsung", value: "Samsung" }
 ];

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Employee Table
          </Typography>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-2">
          <Tabs value={activeTab} className="px-5">
            <TabsHeader>
              {tabs.map(({ label, value }) => (
                <Tab
                  key={value}
                  value={value}
                  onClick={() => setActiveTab(value)}
                  className={activeTab === value ? "text-blue-500" : ""}
                >
                  {label}
                </Tab>
              ))}
            </TabsHeader>
          </Tabs>
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Name", "Company", "Level", "Role", "MAC"].map((el) => (
                    <th
                      key={el}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => {
                  const className = `py-3 px-5 ${
                    index === filteredEmployees.length - 1 ? "" : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={employee.mac_address}>
                        <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {employee.name || "Unknown"}
                        </Typography>
                        </td>
                        <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {employee.company || "Unknown"}
                        </Typography>
                        </td>
                        <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {employee.level || "Unknown"}
                        </Typography>
                        </td>
                        <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {employee.role || "Unknown"}
                        </Typography>
                        </td>
                        <td className={className}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold"
                        >
                          {employee.mac_address}
                        </Typography>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 px-5 text-center">
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        No employees found for {activeTab}
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Employees;