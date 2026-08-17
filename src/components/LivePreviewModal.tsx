import { useState, useEffect } from "react";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  X,
  RefreshCw,
  Eye,
  CheckCircle2,
  Maximize2,
} from "lucide-react";
import { CMSSiteData } from "../types/cms";

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteData: CMSSiteData;
  activeProjectId?: number | null;
}

type DeviceType = "desktop" | "laptop" | "tablet" | "mobile";

export function LivePreviewModal({
  isOpen,
  onClose,
  siteData,
  activeProjectId,
}: LivePreviewModalProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isLandscape, setIsLandscape] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (activeProjectId) return `#project/${activeProjectId}`;
    return "";
  });
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [scale, setScale] = useState<number>(100);

  // Sync route if active project changes
  useEffect(() => {
    if (activeProjectId) {
      setCurrentRoute(`#project/${activeProjectId}`);
    }
  }, [activeProjectId]);

  // Synchronize siteData to live preview storage whenever modal is open or data changes
  useEffect(() => {
    if (!isOpen || !siteData) return;
    try {
      localStorage.setItem("cms_live_preview_data", JSON.stringify(siteData));
      // Broadcast to any open preview frames or windows
      window.postMessage(
        { type: "CMS_PREVIEW_SYNC", payload: siteData },
        "*"
      );
    } catch (e) {
      console.warn("CMS Live Preview: Storage sync warning", e);
    }
  }, [isOpen, siteData]);

  if (!isOpen) return null;

  // Viewport dimensions
  const getDimensions = () => {
    switch (device) {
      case "mobile":
        return isLandscape
          ? { width: 844, height: 390, label: "Mobile (iPhone Landscape)" }
          : { width: 390, height: 844, label: "Mobile (iPhone Portrait)" };
      case "tablet":
        return isLandscape
          ? { width: 1024, height: 768, label: "Tablet (iPad Landscape)" }
          : { width: 768, height: 1024, label: "Tablet (iPad Portrait)" };
      case "laptop":
        return { width: 1200, height: 780, label: "Laptop / Medium Screen" };
      case "desktop":
      default:
        return { width: "100%", height: "100%", label: "Desktop (Fluid 100%)" };
    }
  };

  const dims = getDimensions();

  // Construct iframe preview URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const previewUrl = `${origin}${pathname}?preview=true${currentRoute}`;

  const handleOpenPopoutWindow = () => {
    const win = window.open(
      previewUrl,
      "CMS_LivePreview_Popout",
      "width=1440,height=900,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
    );
    if (win) win.focus();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200">
      {/* Top Controller Bar */}
      <header className="h-16 px-5 border-b border-white/10 bg-neutral-900/90 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand-green/15 border border-brand-green/40">
            <Eye size={14} className="text-brand-green animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-brand-green uppercase tracking-wider">
              Live Preview
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-sans hidden sm:inline-block">
            {dims.label}
          </span>
        </div>

        {/* Center: Device Switchers & Route Selectors */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Device tabs */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => {
                setDevice("desktop");
                setIsLandscape(false);
              }}
              title="Desktop View (100% Fluid)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "desktop"
                  ? "bg-brand-green text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Monitor size={14} />
              <span className="hidden md:inline">Desktop</span>
            </button>

            <button
              onClick={() => {
                setDevice("laptop");
                setIsLandscape(false);
              }}
              title="Laptop View (1200px)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "laptop"
                  ? "bg-brand-green text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Laptop size={14} />
              <span className="hidden md:inline">Laptop</span>
            </button>

            <button
              onClick={() => setDevice("tablet")}
              title="Tablet View (768px)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "tablet"
                  ? "bg-brand-green text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Tablet size={14} />
              <span className="hidden md:inline">Tablet</span>
            </button>

            <button
              onClick={() => setDevice("mobile")}
              title="Mobile View (390px)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "mobile"
                  ? "bg-brand-green text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Smartphone size={14} />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Orientation Toggle for Mobile/Tablet */}
          {(device === "mobile" || device === "tablet") && (
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              title="Rotate Screen Orientation"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isLandscape
                  ? "bg-white/20 border-white/40 text-white"
                  : "bg-neutral-950 border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              <RotateCw size={13} />
              <span className="hidden lg:inline">Rotate</span>
            </button>
          )}

          {/* Quick Route Switcher */}
          <select
            value={currentRoute}
            onChange={(e) => {
              setCurrentRoute(e.target.value);
              setIframeKey(Date.now());
            }}
            className="bg-neutral-950 border border-white/10 text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-green cursor-pointer"
          >
            <option value="">🏠 Home Page</option>
            <option value="#projects">📁 Projects Grid</option>
            <option value="#about">👤 About & Contact</option>
            {siteData?.allProjects?.map((p) => (
              <option key={p.id} value={`#project/${p.id}`}>
                🎬 Project: {p.title}
              </option>
            ))}
          </select>

          {/* Refresh Frame Button */}
          <button
            onClick={() => setIframeKey(Date.now())}
            title="Reload Preview Frame"
            className="p-1.5 rounded-lg bg-neutral-950 border border-white/10 text-neutral-400 hover:text-brand-green transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Right: Popout window & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPopoutWindow}
            title="Open in Independent Pop-out Window for Dual Screens"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer"
          >
            <ExternalLink size={13} />
            <span className="hidden md:inline">Pop-out Window</span>
          </button>

          <button
            onClick={onClose}
            title="Close Preview (Esc)"
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Preview Stage */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-neutral-950/80 relative">
        <div
          className={`transition-all duration-300 ease-out flex flex-col items-center justify-center ${
            device === "desktop"
              ? "w-full h-full"
              : "rounded-2xl border-[8px] border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden bg-neutral-900"
          }`}
          style={
            device === "desktop"
              ? { width: "100%", height: "100%" }
              : {
                  width: `${dims.width}px`,
                  height: `${dims.height}px`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }
          }
        >
          <iframe
            key={iframeKey}
            src={previewUrl}
            title="Interactive Live Portfolio Preview"
            className="w-full h-full border-0 bg-neutral-950 rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </main>

      {/* Footer Info Tip */}
      <footer className="h-8 px-6 bg-neutral-950 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-brand-green" />
          <span>Real-time Isolated Preview Mode • Zero impact on public visitors</span>
        </div>
        <span className="font-mono text-neutral-400">
          URL: {previewUrl}
        </span>
      </footer>
    </div>
  );
}
