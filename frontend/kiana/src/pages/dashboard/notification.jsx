import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import React, { useContext, useState, useMemo } from "react";
import { StreamContext } from "@/context/StreamContext";

export function Notifications() {
  const { notificationHistory, zoneViolations } = useContext(StreamContext);
  const [activeTab, setActiveTab] = useState("All");

  // Define tabs for filtering notifications
  const tabs = [
    { label: "All", value: "All" },
    { label: "Security", value: "zone_violation" },
    { label: "Maintenance", value: "maintenance" },
  ];

  // Define column configurations
  const allColumns = [
    { key: "timestamp", label: "Time" },
    { key: "message", label: "Message" },
    { key: "location", label: "Location" },
    { key: "floor", label: "Floor" },
  ];

  const securityColumns = [
    { key: "timestamp", label: "Time" },
    { key: "name", label: "Name" },
    { key: "company", label: "Company" },
    { key: "message", label: "Message" },
    { key: "location", label: "Location" },
    { key: "floor", label: "Floor" },
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
  ];

  // Combine all notifications with proper typing
  const allNotifications = useMemo(() => {
    return [
      ...notificationHistory,
      ...zoneViolations.map(violation => ({
        ...violation,
        type: violation.type || "zone_violation"
      }))
    ];
  }, [notificationHistory, zoneViolations]);

  // Filter notifications by type with proper fallbacks
  const filteredNotifications = useMemo(() => {
    return activeTab === "All"
      ? allNotifications
      : allNotifications.filter(notif => notif.type === activeTab);
  }, [activeTab, allNotifications]);

  // Enhanced display value getter
  const getDisplayValue = (notif, key) => {
    switch(key) {
      case "timestamp":
        return notif.timestamp ? new Date(notif.timestamp).toLocaleString() : "N/A";
      case "location":
        return notif.location ? `[${notif.location[0]?.toFixed(4)}, ${notif.location[1]?.toFixed(4)}]` : "N/A";
      case "floor":
        return notif.floor || (notif.company ? "ground" : "ground");
      case "rul":
        return notif.rul !== undefined ? notif.rul.toFixed(2) : "N/A";
      case "mac_address":
        return notif.mac_address || notif.mac || "Unknown";
      default:
        return notif[key] || "N/A";
    }
  };

  // Select columns based on active tab
  const columns = useMemo(() => {
    return activeTab === "maintenance" ? maintenanceColumns :
           activeTab === "All" ? allColumns :
           securityColumns;
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
                {filteredNotifications.slice().reverse().map((notif, index) => {
                  const className = `py-3 px-5 ${
                    index === filteredNotifications.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={`${notif.timestamp}-${index}`}>
                      {columns.map(({ key }) => (
                        <td key={key} className={className}>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="text-xs font-semibold text-blue-gray-600"
                          >
                            {getDisplayValue(notif, key)}
                          </Typography>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredNotifications.length === 0 && (
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
        </CardBody>
      </Card>
    </div>
  );
}

Notifications.displayName = "/src/pages/dashboard/notifications.jsx";

export default Notifications;