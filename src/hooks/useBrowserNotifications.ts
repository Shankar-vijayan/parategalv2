// src/hooks/useBrowserNotifications.ts
import { useState, useEffect, useCallback } from "react";

type NotificationPermission = "default" | "denied" | "granted";

export const useBrowserNotifications = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  // Set the initial permission status when the component mounts
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Function to request permission from the user
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);
  }, []);

  // Function to send a notification
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") {
        console.warn("Notification permission not granted.");
        return;
      }

      new Notification(title, options);
    },
    [permission]
  );

  return { permission, requestPermission, sendNotification };
};
