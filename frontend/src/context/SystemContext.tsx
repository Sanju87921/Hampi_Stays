import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

interface SystemSettings {
  guideServiceEnabled: boolean;
  maintenanceMode?: boolean;
  defaultCommissionRate: number;
  requireOtpForSignup: boolean;
  updatedBy?: string;
  verificationSettings?: {
    travellerRequirements: string[];
    resortOwnerRequirements: string[];
    guideRequirements: string[];
  };
}

interface SystemContextType {
  settings: SystemSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  guideServiceEnabled: true,
  maintenanceMode: false,
  defaultCommissionRate: 7.0,
  requireOtpForSignup: true,
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get<SystemSettings>("/settings");
      if (data && typeof data === "object") {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const data = await apiClient.patch<SystemSettings>("/admin/settings", newSettings);
      if (data && typeof data === "object") {
        setSettings(prev => ({ ...prev, ...data }));
      }
      // Force a full refetch to guarantee frontend state matches backend exactly
      await fetchSettings();
    } catch (error) {
      console.error("Failed to update system settings:", error);
      throw error;
    }
  };

  return (
    <SystemContext.Provider value={{ settings, isLoading, refreshSettings, updateSettings }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error("useSystem must be used within a SystemProvider");
  }
  return context;
}
