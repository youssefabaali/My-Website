import { useState } from "react";
import { Monitor, Tablet, Smartphone, Laptop, RotateCw, RefreshCw, X, Eye } from "lucide-react";

interface LivePreviewToolbarProps {
  device: "desktop" | "laptop" | "tablet" | "mobile";
  onDeviceChange: (d: "desktop" | "laptop" | "tablet" | "mobile") => void;
  isLandscape: boolean;
  onToggleOrientation: () => void;
  onRefresh: () => void;
  onExitPreview: () => void;
}

export function LivePreviewToolbar({
  device,
  onDeviceChange,
  isLandscape,
  onToggleOrientation,
  onRefresh,
  onExitPreview,
}: LivePreviewToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 right-4 z-[99999] p-2.5 rounded-full bg-neutral-900/90 border border-brand-green/40 text-brand-green shadow-2xl hover:scale-105 transition-all cursor-pointer backdrop-blur-md"
        title="Open Live Preview Toolbar"
      >
        <Eye size={18} />
      </button>
    );
  }

  return (
    <aside aria-label="Live Preview Controls" className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 px-3 py-2 rounded-2xl bg-neutral-900/95 border border-white/15 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl select-none animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Tag */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-green/15 border border-brand-green/30 mr-1">
        <Eye size={12} className="text-brand-green" />
        <span className="text-[10px] font-mono font-bold text-brand-green uppercase tracking-wider">
          Preview
        </span>
      </div>

      {/* Device tabs */}
      <div className="flex items-center bg-neutral-950 p-0.5 rounded-xl border border-white/10">
        <button
          onClick={() => onDeviceChange("desktop")}
          title="Desktop (Fluid)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            device === "desktop"
              ? "bg-brand-green text-neutral-950 font-bold"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Monitor size={13} />
          <span className="hidden sm:inline">Desktop</span>
        </button>

        <button
          onClick={() => onDeviceChange("laptop")}
          title="Laptop (1200px)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            device === "laptop"
              ? "bg-brand-green text-neutral-950 font-bold"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Laptop size={13} />
          <span className="hidden sm:inline">Laptop</span>
        </button>

        <button
          onClick={() => onDeviceChange("tablet")}
          title="Tablet (768px)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            device === "tablet"
              ? "bg-brand-green text-neutral-950 font-bold"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Tablet size={13} />
          <span className="hidden sm:inline">Tablet</span>
        </button>

        <button
          onClick={() => onDeviceChange("mobile")}
          title="Mobile (390px)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            device === "mobile"
              ? "bg-brand-green text-neutral-950 font-bold"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Smartphone size={13} />
          <span className="hidden sm:inline">Mobile</span>
        </button>
      </div>

      {/* Orientation toggle */}
      {(device === "mobile" || device === "tablet") && (
        <button
          onClick={onToggleOrientation}
          title="Rotate Orientation"
          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
            isLandscape
              ? "bg-white/20 border-white/30 text-white"
              : "bg-neutral-950 border-white/10 text-neutral-400 hover:text-white"
          }`}
        >
          <RotateCw size={13} />
        </button>
      )}

      {/* Refresh */}
      <button
        onClick={onRefresh}
        title="Reload Data"
        className="p-1.5 rounded-lg bg-neutral-950 border border-white/10 text-neutral-400 hover:text-brand-green transition-all cursor-pointer"
      >
        <RefreshCw size={13} />
      </button>

      {/* Exit */}
      <button
        onClick={onExitPreview}
        title="Exit Preview Mode"
        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
