import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { TrashIcon } from "@heroicons/react/24/solid";

export function TempAuth() {
  const [macAddress, setMacAddress] = useState("");
  const [tempMacs, setTempMacs] = useState([]);
  const [error, setError] = useState("");

  const fetchTempMacs = async () => {
    try {
      const response = await fetch("http://localhost:5000/temp-auth");
      const data = await response.json();
      setTempMacs(data);
    } catch (err) {
      console.error("Failed to fetch temporary MACs:", err);
    }
  };

  useEffect(() => {
    fetchTempMacs();
    const interval = setInterval(fetchTempMacs, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddMac = async () => {
    if (!macAddress) {
      setError("MAC address required");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/temp-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac_address: macAddress }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add MAC");
      }
      setMacAddress("");
      setError("");
      fetchTempMacs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMac = async (mac) => {
    try {
      const response = await fetch(`http://localhost:5000/temp-auth/${mac}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove MAC");
      }
      fetchTempMacs();
    } catch (err) {
      console.error("Failed to remove MAC:", err);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Temporary Authorization Management
          </Typography>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-2">
          <div className="p-5">
            <div className="flex gap-4 mb-6">
              <Input
                label="MAC Address"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                error={!!error}
              />
              <Button onClick={handleAddMac} color="blue">
                Add
              </Button>
            </div>
            {error && (
              <Typography color="red" className="mb-4">
                {error}
              </Typography>
            )}
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["MAC Address", "Actions"].map((el) => (
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
                {tempMacs.map((mac, index) => {
                  const className = `py-3 px-5 ${
                    index === tempMacs.length - 1 ? "" : "border-b border-blue-gray-50"
                  }`;
                  return (
                    <tr key={mac}>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {mac}
                        </Typography>
                      </td>
                      <td className={className}>
                        <IconButton
                          variant="text"
                          color="red"
                          onClick={() => handleRemoveMac(mac)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

TempAuth.displayName = "/src/pages/dashboard/temp-auth.jsx";

export default TempAuth;