import { Chip, Typography, Button, Card, CardHeader, CardBody, Tabs, TabsHeader, Tab } from "@material-tailwind/react";
import React, { useContext, useState, useMemo } from "react";
import { StreamContext } from "@/context/StreamContext";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function Notifications() {
  const { notificationHistory, zoneViolations } = useContext(StreamContext);
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const tabs = [
    { label: "All", value: "All" },
    { label: "Security", value: "zone_violation" },
    { label: "Maintenance", value: "maintenance" },
  ];

  const allColumns = [
    { key: "timestamp", label: "Time" },
    { key: "message", label: "Message" },
    { key: "location", label: "Location" },
    { key: "floor", label: "Floor" },
    { key: "priority", label: "Priority" }, // Added
  ];

  const maintenanceColumns = [
    { key: "timestamp", label: "Time" },
    { key: "name", label: "Machine Name" },
    { key: "company", label: "Company" },
    { key: "status", label: "Status" },
    { key: "message", label: "Message" },
    { key: "location", label: "Location" },
    { key: "floor", label: "Floor" },
    { key: "rul", label: "RUL (Hours)" },
    { key: "priority", label: "Priority" }, // Added
  ];

  // Color logic for status
  const getStatusColor = (status) => {
    switch (status) {
      case "Good":
        return "green";
      case "Warning":
        return "yellow";
      case "Breakdown":
        return "red";
      default:
        return "gray";
    }
  };

  const allNotifications = useMemo(() => {
    return [
      ...notificationHistory,
      ...zoneViolations.map(violation => ({
        ...violation,
        type: violation.type || "zone_violation",
        priority: violation.priority || "Medium", // Default for zone violations
      })),
    ];
  }, [notificationHistory, zoneViolations]);

  const filteredNotifications = useMemo(() => {
    setPage(1); // reset page when tab changes
    return activeTab === "All"
      ? allNotifications
      : allNotifications.filter(notif => notif.type === activeTab);
  }, [activeTab, allNotifications]);

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredNotifications.slice().reverse().slice(start, start + rowsPerPage);
  }, [filteredNotifications, page]);

  const totalPages = Math.ceil(filteredNotifications.length / rowsPerPage);

  const getDisplayValue = (notif, key) => {
    switch (key) {
      case "timestamp":
        return notif.timestamp ? new Date(notif.timestamp).toLocaleString() : "N/A";
      case "location":
        return notif.location
          ? `[${notif.location[0]?.toFixed(4)}, ${notif.location[1]?.toFixed(4)}]`
          : "N/A";
      case "floor":
        return notif.floor || (notif.company ? "ground" : "ground");
      case "rul":
        return notif.rul !== undefined ? notif.rul.toFixed(2) : "N/A";
      case "mac_address":
        return notif.mac_address || notif.mac || "Unknown";
      case "priority":
        return notif.priority || (notif.type === "zone_violation" ? "Medium" : "Unknown");
      default:
        return notif[key] || "N/A";
    }
  };

  const columns = useMemo(() => {
    return activeTab === "maintenance"
      ? maintenanceColumns
      : allColumns;
  }, [activeTab]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Notification Table
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-auto">
              <thead>
                <tr>
                  {columns.map(({ label }) => (
                    <th
                      key={label}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {label}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notif, index) => {
                  const className = `py-3 px-5 ${
                    index === paginatedNotifications.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={`${notif.timestamp}-${index}`}>
                      {columns.map(({ key }) => (
                        <td key={key} className={className}>
                          {key === "status" ? (
                            <Chip
                              variant="gradient"
                              color={getStatusColor(notif.status)}
                              value={notif.status || "Unknown"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          ) : (
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="text-xs font-semibold text-blue-gray-600"
                            >
                              {getDisplayValue(notif, key)}
                            </Typography>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paginatedNotifications.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-3 px-5 text-center">
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        No notifications found for {activeTab}
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

Notifications.displayName = "/src/pages/dashboard/notifications.jsx";

export default Notifications;