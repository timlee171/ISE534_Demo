import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import React, { useContext, useState } from "react";
import { StreamContext } from "@/context/StreamContext";

export function Notifications() {
  const { notificationHistory } = useContext(StreamContext);
  const [activeTab, setActiveTab] = useState("All");

  // Define tabs for filtering notifications
  const tabs = [
    { label: "All", value: "All" },
    { label: "Security", value: "zone_violation" },
    { label: "Maintenance", value: "maintenance" },
  ];

  // Filter notifications by type
  const filteredNotifications = activeTab === "All"
    ? notificationHistory
    : notificationHistory.filter((notif) => notif.type === activeTab);

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
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Time", "MAC Address", "Message", "Location"].map((el) => (
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
                {filteredNotifications
                  .slice()
                  .reverse()
                  .map((notif, index) => {
                    const className = `py-3 px-5 ${
                      index === filteredNotifications.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                    }`;

                    return (
                      <tr key={notif.timestamp + (notif.mac || notif.mac_address)}>
                        <td className={className}>
                          <div className="flex items-center gap-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-semibold"
                            >
                              {new Date(notif.timestamp).toLocaleString()}
                            </Typography>
                          </div>
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {notif.mac || notif.mac_address || "Unknown"}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Chip
                            variant="gradient"
                            color={
                              notif.type === "zone_violation"
                                ? "red"
                                : notif.type === "maintenance"
                                ? "yellow"
                                : "gray"
                            }
                            value={notif.message}
                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                          />
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {notif.location
                              ? `[${notif.location[0]}, ${notif.location[1]}]`
                              : "Unknown"}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })}
                {filteredNotifications.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 px-5 text-center">
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