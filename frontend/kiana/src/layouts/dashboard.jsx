import React, { useEffect, useState, useCallback, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton, Alert } from "@material-tailwind/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Sidenav, DashboardNavbar } from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { StreamContext } from "@/context/StreamContext";

// AddNotification function to store in localStorage
const addNotification = (notification) => {
  const existing = JSON.parse(localStorage.getItem("notificationHistory")) || [];
  const isDuplicate = existing.some(
    (n) =>
      n.timestamp === notification.timestamp &&
      n.mac === notification.mac &&
      n.message === notification.message &&
      n.location === notification.location &&
      n.type === notification.type
  );
  if (!isDuplicate) {
    const updated = [...existing, notification];
    localStorage.setItem("notificationHistory", JSON.stringify(updated));
  }
};

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const { onUnauthorized } = useContext(StreamContext);
  const [unauthorizedAlerts, setUnauthorizedAlerts] = useState([]);

  const handleUnauthorizedAlert = useCallback((unauthorized) => {
    const mac = unauthorized.mac_address;
    const location = unauthorized.location;
    
    setUnauthorizedAlerts((prevAlerts) => {
      const isDuplicate = prevAlerts.some(alert => 
        alert.mac === mac && alert.open
      );
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
      addNotification({
        timestamp: Date.now(),
        mac: mac,
        location: location,
        message: "Unauthorized device detected",
        type: "security",
      });
      return [...prevAlerts, newAlert];
    });
  }, []);

  useEffect(() => {
    console.log("Dashboard subscribing to stream events");
    onUnauthorized(handleUnauthorizedAlert);
  }, [onUnauthorized, handleUnauthorizedAlert]);

  useEffect(() => {
    const openAlerts = unauthorizedAlerts.filter((alert) => alert.open);
    if (openAlerts.length === 0) return;

    const timeouts = openAlerts.map((alert) => {
      return setTimeout(() => {
        setUnauthorizedAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, open: false } : a))
        );

        setTimeout(() => {
          setUnauthorizedAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }, 300);
      }, 5000);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [unauthorizedAlerts]);

  const handleCloseAlert = (id) => {
    setUnauthorizedAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, open: false } : a)
    );
    
    setTimeout(() => {
      setUnauthorizedAlerts(prev => prev.filter(a => a.id !== id));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        
        {/* Notification container - changed back to middle top */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md space-y-2">
          {unauthorizedAlerts.map((alert) => (
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
        <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;