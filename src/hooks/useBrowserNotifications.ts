import { useState, useEffect, useCallback } from "react";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    // Check initial permission status on load
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied"; // Default to denied if Notifications API is not supported or SSR
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications API is not supported in this browser.");
      return;
    }

    const checkPermission = () => {
      setPermission(Notification.permission);
    };

    // Listen for changes in permission status (e.g., if user changes it in settings)
    // Note: There's no standard event for this, so polling or relying on explicit checks is common.
    // For simplicity, we just check once and allow explicit request.
    checkPermission();
  }, []); // Run once on component mount

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications API not supported.");
      return;
    }

    if (permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "denied") {
          console.warn("Notification permission denied by user.");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  }, [permission]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn(
          "Notifications API not supported. Cannot send notification."
        );
        return;
      }

      if (permission === "granted") {
        try {
          new Notification(title, options);
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      } else {
        console.warn(`Cannot send notification: Permission is ${permission}.`);
      }
    },
    [permission]
  );

  return { permission, requestPermission, sendNotification };
}
