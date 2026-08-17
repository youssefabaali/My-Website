import { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Radio,
  Layers,
  ChevronDown,
  Sparkles,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import { CMSSiteData } from "../types/cms";

interface DevicePreset {
  id: string;
  name: string;
  category: "mobile" | "tablet" | "laptop" | "desktop";
  width: number | "100%";
  height: number | "100%";
  icon: typeof Smartphone;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: "iphone-15", name: "iPhone 15 / 14 (390 × 844)", category: "mobile", width: 390, height: 844, icon: Smartphone },
  { id: "iphone-se", name: "iPhone SE (375 × 667)", category: "mobile", width: 375, height: 667, icon: Smartphone },
  { id: "ipad-air", name: "iPad Air / 10\" (768 × 1024)", category: "tablet", width: 768, height: 1024, icon: Tablet },
  { id: "ipad-pro", name: "iPad Pro 11\" (834 × 1194)", category: "tablet", width: 834, height: 1194, icon: Tablet },
  { id: "macbook-13", name: "Laptop / MacBook (1280 × 800)", category: "laptop", width: 1280, height: 800, icon: Laptop },
  { id: "desktop-full", name: "Desktop (Fluid 100%)", category: "desktop", width: "100%", height: "100%", icon: Monitor },
];

export function StandalonePreview() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("iphone-15");
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState<number>(100);
  const [autoFit, setAutoFit] = useState(true);
  const [currentHash, setCurrentHash] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.hash || "";
    }
    return "";
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [isSyncPulsing, setIsSyncPulsing] = useState(false);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [availableProjects, setAvailableProjects] = useState<{ id: number; title: string }[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const activePreset = DEVICE_PRESETS.find((p) => p.id === selectedPresetId) || DEVICE_PRESETS[0];

  // Calculate actual pixel width & height considering orientation
  let currentWidth: number | string = activePreset.width;
  let currentHeight: number | string = activePreset.height;

  if (typeof activePreset.width === "number" && typeof activePreset.height === "number") {
    if (isLandscape) {
      currentWidth = Math.max(activePreset.width, activePreset.height);
      currentHeight = Math.min(activePreset.width, activePreset.height);
    } else {
      currentWidth = Math.min(activePreset.width, activePreset.height);
      currentHeight = Math.max(activePreset.width, activePreset.height);
    }
  }

  // Auto-fit calculation to ensure phone/tablet frames fit comfortably on any screen height
  useEffect(() => {
    if (!autoFit || activePreset.width === "100%" || typeof currentHeight !== "number") {
      if (activePreset.width === "100%") setScale(100);
      return;
    }

    const calculateFit = () => {
      if (!stageRef.current || typeof currentHeight !== "number" || typeof currentWidth !== "number") return;
      const stageHeight = stageRef.current.clientHeight - 48; // padding
      const stageWidth = stageRef.current.clientWidth - 48;
      
      const scaleH = stageHeight / currentHeight;
      const scaleW = stageWidth / currentWidth;
      const optimalScale = Math.min(1, Math.min(scaleH, scaleW));
      setScale(Math.max(40, Math.round(optimalScale * 100)));
    };

    calculateFit();
    window.addEventListener("resize", calculateFit);
    return () => window.removeEventListener("resize", calculateFit);
  }, [autoFit, selectedPresetId, isLandscape, currentHeight, currentWidth]);

  // Sync with BroadcastChannel and LocalStorage from CMS
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;

    const handleNewData = (siteData: CMSSiteData) => {
      if (!siteData) return;
      setIsSyncPulsing(true);
      setLastSyncTime(new Date().toLocaleTimeString());

      if (siteData.allProjects && Array.isArray(siteData.allProjects)) {
        setAvailableProjects(
          siteData.allProjects.map((p) => ({ id: p.id, title: p.title || `Project #${p.id}` }))
        );
      }

      // Forward to iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            { type: "CMS_PREVIEW_SYNC", payload: siteData },
            "*"
          );
        } catch (e) {}
      }

      setTimeout(() => setIsSyncPulsing(false), 600);
    };

    // 1. Check local storage initial state
    try {
      const stored = localStorage.getItem("cms_live_preview_snapshot") || localStorage.getItem("cms_portfolio_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        handleNewData(parsed);
      }
    } catch (e) {}

    // 2. Setup BroadcastChannel for 0ms multi-tab sync
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("cms_live_preview_bus");
        broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === "SYNC_DATA" && event.data.payload) {
            handleNewData(event.data.payload);
          }
        };
      }
    } catch (e) {}

    // 3. Setup window storage listener as backup
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cms_live_preview_snapshot" && e.newValue) {
        try {
          handleNewData(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 4. Handle incoming message from iframe when it signals it is mounted and ready
    const handleFrameReady = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_FRAME_READY") {
        try {
          const stored = localStorage.getItem("cms_live_preview_snapshot") || localStorage.getItem("cms_portfolio_data");
          if (stored) {
            const parsed = JSON.parse(stored);
            handleNewData(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener("message", handleFrameReady);

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("message", handleFrameReady);
    };
  }, []);

  // Listen to hash changes on the main window
  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || "");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Update hash & iframe location
  const handleNavigateHash = (hash: string) => {
    setCurrentHash(hash);
    window.location.hash = hash;
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.hash = hash;
      } catch (e) {
        setIframeKey(Date.now());
      }
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const iframeSrc = `${origin}${pathname}?preview_mode=frame${currentHash}`;

  return (
    <div className="min-h-screen w-screen bg-[#0c0c0e] text-neutral-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Professional F12 Emulation Toolbar */}
      <header className="h-16 px-4 sm:px-6 bg-[#141418] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 shadow-2xl z-50">
        {/* Left Section: Live Pulse Indicator & Device Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-green/10 border border-brand-green/30">
            <span className={`w-2.5 h-2.5 rounded-full ${isSyncPulsing ? "bg-brand-green animate-ping" : "bg-brand-green animate-pulse"}`} />
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider hidden sm:inline">
              LIVE PREVIEW
            </span>
          </div>

          {/* Device Selection Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedPresetId}
              onChange={(e) => {
                setSelectedPresetId(e.target.value);
                if (e.target.value === "desktop-full") setScale(100);
              }}
              className="bg-[#1e1e24] hover:bg-[#272730] border border-white/15 text-xs text-neutral-200 font-semibold py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:border-brand-green cursor-pointer transition-all appearance-none"
            >
              {DEVICE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 text-neutral-400 pointer-events-none" />
          </div>

          {/* Orientation Toggle (Portrait / Landscape) */}
          {activePreset.category !== "desktop" && (
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              title={isLandscape ? "Switch to Portrait" : "Switch to Landscape"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                isLandscape
                  ? "bg-brand-green/20 border-brand-green text-brand-green"
                  : "bg-[#1e1e24] hover:bg-[#272730] border-white/15 text-neutral-300 hover:text-white"
              }`}
            >
              <RotateCw size={13} className={isLandscape ? "rotate-90 transition-transform" : "transition-transform"} />
              <span className="hidden md:inline">{isLandscape ? "Landscape" : "Portrait"}</span>
            </button>
          )}
        </div>

        {/* Center: Route Switcher & Zoom Scale */}
        <div className="flex items-center gap-2">
          {/* Quick Page Route Selector */}
          <select
            value={currentHash}
            onChange={(e) => handleNavigateHash(e.target.value)}
            className="bg-[#1e1e24] hover:bg-[#272730] border border-white/15 text-xs text-neutral-200 font-medium py-2 px-3 rounded-lg focus:outline-none focus:border-brand-green cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
          >
            <option value="">🏠 Home View</option>
            <option value="#projects">📁 Projects Grid</option>
            <option value="#about">👤 About & Contact</option>
            {availableProjects.map((p) => (
              <option key={p.id} value={`#project/${p.id}`}>
                🎬 Project: {p.title}
              </option>
            ))}
          </select>

          {/* Scale / Zoom Control */}
          {activePreset.category !== "desktop" && (
            <div className="hidden lg:flex items-center gap-1.5 bg-[#1e1e24] border border-white/15 rounded-lg px-2 py-1">
              <span className="text-[11px] text-neutral-400">Zoom:</span>
              <select
                value={autoFit ? "auto" : scale}
                onChange={(e) => {
                  if (e.target.value === "auto") {
                    setAutoFit(true);
                  } else {
                    setAutoFit(false);
                    setScale(Number(e.target.value));
                  }
                }}
                className="bg-transparent text-xs text-brand-green font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="auto">Auto-Fit</option>
                <option value="100">100%</option>
                <option value="85">85%</option>
                <option value="75">75%</option>
                <option value="60">60%</option>
                <option value="50">50%</option>
              </select>
            </div>
          )}

          {/* Hard Refresh Frame Button */}
          <button
            onClick={() => setIframeKey(Date.now())}
            title="Reload Frame (R)"
            className="p-2 rounded-lg bg-[#1e1e24] hover:bg-[#272730] border border-white/15 text-neutral-400 hover:text-brand-green transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Right Section: Sync Status & Open in New Tab */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
              0ms Real-time Link
            </span>
            <span className="text-[11px] text-neutral-300 font-mono">
              Synced: {lastSyncTime}
            </span>
          </div>

          <a
            href={iframeSrc.replace("preview_mode=frame", "preview_mode=direct")}
            target="_blank"
            rel="noreferrer"
            title="Open pure unboxed webpage in a normal browser tab"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-neutral-300 hover:text-white font-semibold transition-all cursor-pointer"
          >
            <ExternalLink size={13} />
            <span>Open Normal Tab</span>
          </a>
        </div>
      </header>

      {/* Main Studio Viewport Stage */}
      <main
        ref={stageRef}
        className="flex-1 w-full overflow-auto flex items-center justify-center p-4 sm:p-8 bg-[#0c0c0e] relative"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      >
        {/* Device Frame Emulation */}
        <div
          className="transition-all duration-300 ease-out flex items-center justify-center origin-top relative"
          style={{
            transform: activePreset.category !== "desktop" ? `scale(${scale / 100})` : "none",
            transformOrigin: "top center",
          }}
        >
          <div
            className={`transition-all duration-300 ease-out bg-black relative flex flex-col ${
              activePreset.category === "desktop"
                ? "w-full h-full min-w-[90vw] min-h-[85vh] rounded-xl border border-white/15 shadow-2xl overflow-hidden"
                : activePreset.category === "laptop"
                ? "rounded-2xl border-[14px] border-[#1e1e24] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden"
                : activePreset.category === "tablet"
                ? "rounded-[32px] border-[14px] border-[#1e1e24] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden"
                : "rounded-[44px] border-[12px] border-[#1e1e24] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden"
            }`}
            style={{
              width: typeof currentWidth === "number" ? `${currentWidth}px` : "100%",
              height: typeof currentHeight === "number" ? `${currentHeight}px` : "100%",
              minWidth: typeof currentWidth === "number" ? `${currentWidth}px` : "100%",
              minHeight: typeof currentHeight === "number" ? `${currentHeight}px` : "100%",
            }}
          >
            {/* Speaker / Notch for Mobile simulation */}
            {activePreset.category === "mobile" && !isLandscape && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-40 flex items-center justify-center">
                <div className="w-10 h-1 bg-neutral-800 rounded-full" />
              </div>
            )}

            {/* The Real Website in True Responsive Iframe */}
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={iframeSrc}
              title="Real-time Responsive Viewport Emulation"
              className="w-full h-full border-0 bg-[#131313] flex-1"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      </main>

      {/* Footer Info Bar */}
      <footer className="h-7 px-4 bg-[#141418] border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-brand-green" />
          <span>Device Resolution: {currentWidth} × {currentHeight} px ({scale}%)</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span>Target Hash: {currentHash || "#home"}</span>
        </div>
      </footer>
    </div>
  );
}
