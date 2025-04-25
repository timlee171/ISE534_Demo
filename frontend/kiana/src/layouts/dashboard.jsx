import React, { useEffect, useState, useCallback, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { IconButton, Alert } from "@material-tailwind/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Sidenav, DashboardNavbar } from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { StreamContext } from "@/context/StreamContext";

export function Dashboard() {
  const { unauthorizedDevices, zoneViolations, setNotificationHistory } = useContext(StreamContext);
  const [controller, dispatch] = useMaterialTailwindController();
  const [unauthorizedAlerts, setUnauthorizedAlerts] = useState([]);
  const [zoneViolationAlerts, setZoneViolationAlerts] = useState([]);

  // Handle unauthorized devices
  const handleUnauthorizedAlert = useCallback((unauthorized) => {
    const mac = unauthorized.mac_address;
    const location = unauthorized.location;

    setUnauthorizedAlerts((prevAlerts) => {
      const isDuplicate = prevAlerts.some((alert) => alert.mac === mac && alert.open);
      if (isDuplicate) {
        return prevAlerts;
      }

      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const message = `⚠️ Unauthorized MAC detected: ${mac}`;

      const newAlert = {
        id,
        mac,
        message,
        open: true,
      };

      // Add to notification history
      setNotificationHistory((prev) => [
        {
          timestamp: Date.now(),
          mac: mac,
          location: location,
          message: "Unauthorized device detected",
          type: "security",
        },
        ...prev,
      ]);

      return [...prevAlerts, newAlert];
    });
  }, [setNotificationHistory]);

  // Handle zone violations
  const handleZoneViolationAlert = useCallback((violation) => {
    const mac = violation.mac_address;
    const name = violation.name;
    const company = violation.company;
    const zone_company = violation.zone_company;

    setZoneViolationAlerts((prevAlerts) => {
      const isDuplicate = prevAlerts.some(
        (alert) => alert.mac === mac && alert.zone_company === zone_company && alert.open
      );
      if (isDuplicate) {
        return prevAlerts;
      }

      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const message = `⚠️ ${name} (${company}) entered ${zone_company} zone`;

      const newAlert = {
        id,
        mac,
        zone_company,
        message,
        open: true,
      };

      // Add to notification history
      setNotificationHistory((prev) => [
        {
          timestamp: Date.now(),
          mac: mac,
          location: violation.location,
          message: `${name} (${company}) entered ${zone_company} zone`,
          type: "zone_violation",
        },
        ...prev,
      ]);

      return [...prevAlerts, newAlert];
    });
  }, [setNotificationHistory]);

  // Process unauthorizedDevices
  useEffect(() => {
    console.log("unauthorizedDevices in Dashboard:", unauthorizedDevices); // Debug
    if (Array.isArray(unauthorizedDevices)) {
      unauthorizedDevices.forEach((device) => {
        handleUnauthorizedAlert(device);
      });
    } else {
      console.warn("unauthorizedDevices is not an array:", unauthorizedDevices);
    }
  }, [unauthorizedDevices, handleUnauthorizedAlert]);

  // Process zoneViolations
  useEffect(() => {
    console.log("zoneViolations in Dashboard:", zoneViolations); // Debug
    if (Array.isArray(zoneViolations)) {
      zoneViolations.forEach((violation) => {
        handleZoneViolationAlert(violation);
      });
    } else {
      console.warn("zoneViolations is not an array:", zoneViolations);
    }
  }, [zoneViolations, handleZoneViolationAlert]);

  // Auto-close alerts after 5 seconds
  useEffect(() => {
    const allAlerts = [...unauthorizedAlerts, ...zoneViolationAlerts].filter((alert) => alert.open);
    if (allAlerts.length === 0) return;

    const timeouts = allAlerts.map((alert) => {
      return setTimeout(() => {
        setUnauthorizedAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, open: false } : a))
        );
        setZoneViolationAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, open: false } : a))
        );

        setTimeout(() => {
          setUnauthorizedAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          setZoneViolationAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }, 300);
      }, 5000);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [unauthorizedAlerts, zoneViolationAlerts]);

  const handleCloseAlert = (id) => {
    setUnauthorizedAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, open: false } : a))
    );
    setZoneViolationAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, open: false } : a))
    );

    setTimeout(() => {
      setUnauthorizedAlerts((prev) => prev.filter((a) => a.id !== id));
      setZoneViolationAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={
          controller.sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        
        {/* Notification container - middle top */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md space-y-2">
          {[...unauthorizedAlerts, ...zoneViolationAlerts].map((alert) => (
            <Alert
              key={alert.id}
              color="red"
              icon={<InformationCircleIcon className="h-6 w-6" />}
              open={alert.open}
              onClose={() => handleCloseAlert(alert.id)}
              dismissible
              className="transition-opacity duration-300 mx-auto"
            >
              {alert.message}
            </Alert>
          ))}
        </div>
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "dashboard" &&
              pages.map(({ path, element }) => (
                <Route exact path={path} element={element} key={path} />
              ))
          )}
        </Routes>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layouts/dashboard.jsx";

export default Dashboard;