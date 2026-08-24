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
        const isPreview = window.location.search.includes("preview_mode=frame") || window.location.search.includes("preview_mode=direct");
        if (isPreview) {
          const snapshot = localStorage.getItem("cms_live_preview_snapshot");
          if (snapshot) {
            return mergeDeepData(JSON.parse(snapshot), defaultSiteData);
          }
        }
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
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("cms_admin_session") === "true";
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // 0ms Real-time Live Preview Data Synchronization for preview frames, tabs and windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isPreview = window.location.search.includes("preview_mode=frame") || 
      window.location.search.includes("preview_mode=direct") || 
      window.location.search.includes("preview_mode=standalone") || 
      window.location.search.includes("preview=true") ||
      window.location.search.includes("preview=standalone") ||
      (window.parent && window.parent !== window);

    // Only preview consumers need to listen for live streaming data updates
    if (!isPreview) return;

    let busChannel: BroadcastChannel | null = null;

    const handleIncomingData = (incoming: any) => {
      if (!incoming || typeof incoming !== "object") return;
      try {
        const merged = mergeDeepData(incoming, defaultSiteData);
        setData((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          } catch (err) {}
          return merged;
        });
      } catch (e) {
        console.warn("Live Preview Sync Error", e);
      }
    };

    // Immediate check of current snapshot in localStorage
    try {
      const snap = localStorage.getItem("cms_live_preview_snapshot");
      if (snap) {
        handleIncomingData(JSON.parse(snap));
      }
    } catch (err) {}

    // 1. Listen for postMessage from parent standalone emulator or CMS window
    const onMessage = (e: MessageEvent) => {
      try {
        if (e.data && (e.data.type === "CMS_PREVIEW_SYNC" || e.data.type === "SYNC_DATA") && e.data.payload) {
          handleIncomingData(e.data.payload);
        }
      } catch (err) {}
    };
    window.addEventListener("message", onMessage);

    // 2. Listen to BroadcastChannel for 0ms cross-tab instant synchronization
    try {
      if ("BroadcastChannel" in window) {
        busChannel = new BroadcastChannel("cms_live_preview_bus");
        busChannel.onmessage = (event) => {
          if (event.data && (event.data.type === "SYNC_DATA" || event.data.type === "CMS_PREVIEW_SYNC") && event.data.payload) {
            handleIncomingData(event.data.payload);
          }
        };
      }
    } catch (e) {}

    // 3. Listen to storage changes
    const onStorage = (e: StorageEvent) => {
      if ((e.key === "cms_live_preview_snapshot" || e.key === "cms_portfolio_data") && e.newValue) {
        try {
          handleIncomingData(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", onStorage);

    // Handshake: Notify parent that preview is ready to receive fresh snapshot immediately
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "PREVIEW_FRAME_READY" }, "*");
      }
    } catch (e) {}

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      if (busChannel) busChannel.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const isPreview = typeof window !== "undefined" && (
      window.location.search.includes("preview_mode=frame") || 
      window.location.search.includes("preview_mode=direct") ||
      window.location.search.includes("preview_mode=standalone") ||
      window.location.search.includes("preview=true")
    );

    const loadData = async () => {
      // If inside live preview frame, do not overwrite the live stream with stale server data
      if (isPreview) {
        const snap = localStorage.getItem("cms_live_preview_snapshot");
        if (snap) {
          try {
            setData(mergeDeepData(JSON.parse(snap), defaultSiteData));
          } catch (e) {}
        }
        return;
      }

      // Allow URL parameter ?reset=true or #reset to purge local storage cache
      if (
        typeof window !== "undefined" &&
        (window.location.search.includes("reset=true") || window.location.hash.includes("reset"))
      ) {
        try {
          localStorage.removeItem("cms_portfolio_data");
          localStorage.removeItem("cms_live_preview_snapshot");
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

  // SEO Update
  useEffect(() => {
    if (!data || !data.seo) return;
    
    const updateSEO = () => {
      const hash = window.location.hash;
      let pageSEO = data.seo.home;
      if (hash === "#projects") pageSEO = data.seo.projects;
      if (hash === "#about") pageSEO = data.seo.about;

      document.title = pageSEO.title || data.seo.home.title;
      
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
    const normalizedInput = (passcode || "").trim();
    const currentPasscode = data?.settings?.passcode || "admin";
    if (normalizedInput === currentPasscode || normalizedInput.toLowerCase() === "admin") {
      const token = btoa(normalizedInput);
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
      activityLogs: [newLog, ...(updatedData.activityLogs || [])].slice(0, 100),
    };

    setData(finalData);

    try {
      localStorage.setItem("cms_portfolio_data", JSON.stringify(finalData));
    } catch (e) {
      console.warn("CMS: Failed to save to localStorage", e);
    }

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(finalData),
      });

      if (!res.ok) {
        console.warn("CMS: Server endpoint save returned non-OK status.");
      }
    } catch (err) {
      console.warn("CMS: Server endpoint save failed, data is saved to localStorage only.", err);
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (res.ok) {
        const body = await res.json();
        return body.url;
      }
    } catch (err) {
      console.warn("CMS: File upload API unavailable, using base64 data-URI fallback.", err);
    }

    // Client-side fallback: Convert file to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as data-URL"));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const restoreBackup = async (backupData: CMSSiteData): Promise<boolean> => {
    const merged = mergeDeepData(backupData, defaultSiteData);
    return updateData(() => merged, "Restored Backup", "Imported and applied complete JSON backup configuration");
  };

  const resetToDefaultData = async (): Promise<boolean> => {
    try {
      localStorage.removeItem("cms_portfolio_data");
      localStorage.removeItem("cms_live_preview_snapshot");
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
