import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip
} from "@material-tailwind/react";
import React, { useContext } from "react";
import { StreamContext } from "@/context/StreamContext";

export function Machine() {
  const { machines, machineStatuses } = useContext(StreamContext);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Machine Status Table
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Machine Name", "Company", "Status", "RUL (hours)", "Location", "Time"].map((el) => (
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
              {machines.map((machine, index) => {
                const status = machineStatuses[machine.machine_id] || {};
                const className = `py-3 px-5 ${
                  index === machines.length - 1 ? "" : "border-b border-blue-gray-50"
                }`;

                return (
                  <tr key={machine.machine_id || index}>
                    <td className={className}>
                      <div className="flex items-center gap-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold"
                        >
                          {machine.name}
                        </Typography>
                      </div>
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {machine.company}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Chip
                        variant="gradient"
                        color={
                          status.status === "Good"
                            ? "green"
                            : status.status === "Warning"
                            ? "yellow"
                            : status.status === "Breakdown"
                            ? "red"
                            : "gray"
                        }
                        value={status.status || "Unknown"}
                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                      />
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {status.rul != null ? status.rul.toFixed(2) : "Unknown"}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {status.location ? `(${status.location[0]}, ${status.location[1]})` : "Unknown"}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {status.timestamp ? new Date(status.timestamp).toLocaleString() : "Unknown"}
                      </Typography>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default Machine;