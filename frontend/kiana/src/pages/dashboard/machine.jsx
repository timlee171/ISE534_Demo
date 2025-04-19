import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip
} from "@material-tailwind/react";
import React, { useEffect, useState } from "react";


export function Machine() {
  const [notificationHistory, setNotificationHistory] = useState([]);

  useEffect(() => {
    if (!sessionStorage.getItem("hasClearedHistory")) {
      localStorage.removeItem("notificationHistory");
      sessionStorage.setItem("hasClearedHistory", "true");
    }
    const stored = JSON.parse(localStorage.getItem("notificationHistory")) || [];
    setNotificationHistory(stored.reverse()); // newest first
  }, []);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Machine Log Table
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Time", "Machine", "Status", "Location"].map((el) => (
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
              {notificationHistory.map((notif, index) => {
                  const className = `py-3 px-5 ${
                    index === notificationHistory.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={notif.id || index}>
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
                          {notif.mac}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={notif.type === "security"
                            ? "red"
                            : notif.type === "maintenance"
                            ? "yellow"
                            : "gray"}
                          value={notif.message}
                          className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {notif.location || "Unknown"}
                        </Typography>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default Machine;

