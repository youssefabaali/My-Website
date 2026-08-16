import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CMSSiteData, ActivityLog } from "../types/cms";
import { defaultSiteData } from "../defaultData";

interface CMSContextType {
  data: CMSSiteData;
  isLoading: boolean;
  isAdmin: boolean;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
  updateData: (updater: (prev: CMSSiteData) => CMSSiteData, action?: string, details?: string) => Promise<boolean>;
  uploadFile: (file: File) => Promise<string>;
  restoreBackup: (backupData: CMSSiteData) => Promise<boolean>;
  resetToDefaultData: () => Promise<boolean>;
  clearAllSiteStorage: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function mergeDeepData(serverData: any, defaultData: CMSSiteData): CMSSiteData {
  if (!serverData || typeof serverData !== "object") return defaultData;

  return {
    name: serverData.name || defaultData.name,
    title: serverData.title || defaultData.title,
    tagline: serverData.tagline || defaultData.tagline,
    email: serverData.email || defaultData.email,
    myInfo: serverData.myInfo !== undefined ? serverData.myInfo : defaultData.myInfo,
    myInfoMobile: serverData.myInfoMobile !== undefined ? serverData.myInfoMobile : defaultData.myInfoMobile,
    heroImage: serverData.heroImage || defaultData.heroImage,
    heroImageMobile: serverData.heroImageMobile || defaultData.heroImageMobile,
    settings: {
      ...defaultData.settings,
      ...(serverData.settings || {}),
    },
    design: {
      ...defaultData.design,
      ...(serverData.design || {}),
      colors: {
        ...defaultData.design?.colors,
        ...(serverData.design?.colors || {}),
      },
      typography: {
        ...defaultData.design?.typography,
        ...(serverData.design?.typography || {}),
      },
      layout: {
        ...defaultData.design?.layout,
        ...(serverData.design?.layout || {}),
      },
    },
    aboutMe: {
      ...defaultData.aboutMe,
      ...(serverData.aboutMe || {}),
      skills: Array.isArray(serverData.aboutMe?.skills) ? serverData.aboutMe.skills : defaultData.aboutMe?.skills || [],
    },
    allProjects: Array.isArray(serverData.allProjects) ? serverData.allProjects : defaultData.allProjects || [],
    projects: Array.isArray(serverData.projects) ? serverData.projects : defaultData.projects || [],
    projectDetails: Array.isArray(serverData.projectDetails) ? serverData.projectDetails : defaultData.projectDetails || [],
    services: Array.isArray(serverData.services) ? serverData.services : defaultData.services || [],
    socials: Array.isArray(serverData.socials) ? serverData.socials : defaultData.socials || [],
    aboutSocials: Array.isArray(serverData.aboutSocials) ? serverData.aboutSocials : Array.isArray(serverData.socials) ? serverData.socials : defaultData.aboutSocials || [],
    contact: {
      ...defaultData.contact,
      ...(serverData.contact || {}),
    },
    nav: Array.isArray(serverData.nav) ? serverData.nav : defaultData.nav || [],
    footer: {
      ...defaultData.footer,
      ...(serverData.footer || {}),
    },
    showreel: {
      ...defaultData.showreel,
      ...(serverData.showreel || {}),
    },
    seo: {
      ...defaultData.seo,
      ...(serverData.seo || {}),
      home: { ...defaultData.seo?.home, ...(serverData.seo?.home || {}) },
      projects: { ...defaultData.seo?.projects, ...(serverData.seo?.projects || {}) },
      about: { ...defaultData.seo?.about, ...(serverData.seo?.about || {}) },
    },
    activityLogs: Array.isArray(serverData.activityLogs) ? serverData.activityLogs : defaultData.activityLogs || [],
    homeTitles: { ...defaultData.homeTitles, ...(serverData.homeTitles || {}) },
    homeVisibility: { ...defaultData.homeVisibility, ...(serverData.homeVisibility || {}) },
    projectCategories: Array.isArray(serverData.projectCategories) ? serverData.projectCategories : defaultData.projectCategories || [],
  };
}

export function CMSProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CMSSiteData>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cms_portfolio_data");
        if (cached) {
          const parsed = JSON.parse(cached);
          return mergeDeepData(parsed, defaultSiteData);
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultSiteData;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Allow URL parameter ?reset=true or #reset to purge local storage cache
      if (
        typeof window !== "undefined" &&
        (window.location.search.includes("reset=true") || window.location.hash.includes("reset"))
      ) {
        try {
          localStorage.removeItem("cms_portfolio_data");
        } catch (e) {
          // ignore
        }
      }

      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const serverData = await res.json();
          const mergedData = mergeDeepData(serverData, defaultSiteData);
          setData(mergedData);
          localStorage.setItem("cms_portfolio_data", JSON.stringify(mergedData));
        } else {
          const cached = localStorage.getItem("cms_portfolio_data");
          if (cached) {
            const parsed = JSON.parse(cached);
            setData(mergeDeepData(parsed, defaultSiteData));
          } else {
            setData(defaultSiteData);
          }
        }
      } catch (err) {
        console.warn("CMS: Failed to fetch server data, using localStorage/default fallback.", err);
        const cached = localStorage.getItem("cms_portfolio_data");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setData(mergeDeepData(parsed, defaultSiteData));
          } catch (e) {
            setData(defaultSiteData);
          }
        } else {
          setData(defaultSiteData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check login state
    const adminSession = localStorage.getItem("cms_admin_session");
    if (adminSession === "true") {
      setIsAdmin(true);
    }

    loadData();
  }, []);

  // Listen to cross-window storage events and BroadcastChannel for Instant Real-Time Preview
  useEffect(() => {
    // 1. Listen for standard storage events (fires across different windows/tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cms_portfolio_data" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setData(mergeDeepData(parsed, defaultSiteData));
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // 2. Fast 0ms BroadcastChannel for instantaneous live syncing across pop-out windows
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("cms_live_preview_sync");
        channel.onmessage = (event) => {
          if (event.data && event.data.type === "SYNC_DATA" && event.data.payload) {
            setData(mergeDeepData(event.data.payload, defaultSiteData));
          }
        };
      } catch (e) {
        // broadcastchannel not supported
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);
  useEffect(() => {
    if (!data || !data.seo) return;
    
    // Simple dynamic SEO updating on page hash changes
    const updateSEO = () => {
      const hash = window.location.hash;
      let pageSEO = data.seo.home;
      if (hash === "#projects") pageSEO = data.seo.projects;
      if (hash === "#about") pageSEO = data.seo.about;

      document.title = pageSEO.title || data.seo.home.title;
      
      // Update meta elements
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", pageSEO.description);

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", pageSEO.keywords);
    };

    window.addEventListener("hashchange", updateSEO);
    updateSEO(); // run once on load

    return () => window.removeEventListener("hashchange", updateSEO);
  }, [data]);

  const getAuthToken = (): string => {
    return localStorage.getItem("cms_auth_token") || "admin-session-granted";
  };

  const login = async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        const body = await res.json();
        const token = body.token || btoa(passcode);
        setIsAdmin(true);
        localStorage.setItem("cms_admin_session", "true");
        localStorage.setItem("cms_auth_token", token);
        return true;
      }
    } catch (err) {
      console.warn("CMS Login: Server endpoint unavailable, verifying on client-side passcode.", err);
    }

    // Client-side fallback login check
    if (passcode === data.settings.passcode) {
      const token = btoa(passcode);
      setIsAdmin(true);
      localStorage.setItem("cms_admin_session", "true");
      localStorage.setItem("cms_auth_token", token);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("cms_admin_session");
    localStorage.removeItem("cms_auth_token");
  };

  const updateData = async (
    updater: (prev: CMSSiteData) => CMSSiteData,
    action: string = "Modified Content",
    details: string = "Updated section or general settings"
  ): Promise<boolean> => {
    const updatedData = updater(data);

    // Append activity log
    const newLog: ActivityLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    
    const finalData = {
      ...updatedData,
      activityLogs: [newLog, ...(updatedData.activityLogs || [])].slice(0, 100), // Keep last 100 logs
    };

    // Optimistically update frontend state
    setData(finalData);
    try {
      localStorage.setItem("cms_portfolio_data", JSON.stringify(finalData));
    } catch (storageErr) {
      console.warn("CMS: LocalStorage quota exceeded or browser storage write issue, data updated in active state.", storageErr);
    }

    // Broadcast instantaneously to all open preview windows (0ms delay)
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("cms_live_preview_sync");
        channel.postMessage({ type: "SYNC_DATA", payload: finalData });
        channel.close();
      }
    } catch (e) {
      // ignore
    }

    try {
      const token = getAuthToken();
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(finalData),
      });
      return res.ok;
    } catch (err) {
      console.error("CMS: Failed to save to server, saved locally in cache instead.", err);
      return true; // Return true as it succeeded locally in browser
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const body = await res.json();
        if (body.fileUrl) {
          return body.fileUrl; // e.g. /uploads/image.png
        }
      }
    } catch (err) {
      console.warn("CMS: Server upload failed or timed out, falling back to direct Data URL.", err);
    }

    // Direct fast fallback for offline/static deployment (e.g. GitHub Pages)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(file);
    });
  };

  const restoreBackup = async (backupData: CMSSiteData): Promise<boolean> => {
    return updateData(
      () => backupData,
      "Backup Restored",
      "Successfully restored a full JSON backup."
    );
  };

  const resetToDefaultData = async (): Promise<boolean> => {
    try {
      localStorage.removeItem("cms_portfolio_data");
    } catch (e) {
      console.warn("CMS: Failed to clear localStorage item", e);
    }
    setData(defaultSiteData);

    try {
      await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(defaultSiteData),
      });
    } catch (err) {
      console.warn("CMS: Server endpoint save on reset failed.", err);
    }

    return true;
  };

  const clearAllSiteStorage = async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch (e) {}
    try {
      sessionStorage.clear();
    } catch (e) {}
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.indexedDB && typeof window.indexedDB.databases === "function") {
      try {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
      } catch (e) {}
    }
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      } catch (e) {}
    }
    window.location.href = window.location.origin + "?clear=" + Date.now();
  };

  return (
    <CMSContext.Provider
      value={{
        data,
        isLoading,
        isAdmin,
        login,
        logout,
        updateData,
        uploadFile,
        restoreBackup,
        resetToDefaultData,
        clearAllSiteStorage,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
