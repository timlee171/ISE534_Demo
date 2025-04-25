import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Button,
} from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { StreamContext } from "@/context/StreamContext";

export function Employees() {
  const { rtlsData } = useContext(StreamContext);
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then((response) => response.json())
      .then((data) => setDevices(data))
      .catch((error) => console.error("Error fetching devices:", error));
  }, []);

  const tabs = [
    { label: "All", value: "All" },
    { label: "Apple", value: "Apple" },
    { label: "Nvidia", value: "Nvidia" },
    { label: "Samsung", value: "Samsung" },
  ];

  const employees = useMemo(
    () => devices.filter((d) => d.type === "employee"),
    [devices]
  );

  const filteredEmployees = useMemo(() => {
    setPage(1); // reset page when tab changes
    return activeTab === "All"
      ? employees
      : employees.filter((e) => e.company === activeTab);
  }, [employees, activeTab]);

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

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
                  {["Name", "Company", "Floor", "Role", "MAC"].map((el) => (
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
                {paginatedEmployees.map((employee, index) => {
                  const className = `py-3 px-5 ${
                    index === paginatedEmployees.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={`${employee.mac_address}-${index}`}>
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
                          {employee.floor || "Unknown"}
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
                {paginatedEmployees.length === 0 && (
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Typography className="text-sm font-medium">
                Page {page} of {totalPages}
              </Typography>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default Employees;
