import React from "react";
import { Monitor, Tablet, Smartphone, Sparkles, ExternalLink, X, ChevronDown, CheckCircle2 } from "lucide-react";

export type DeviceViewport = "desktop" | "tablet" | "mobile";

interface LivePreviewToolbarProps {
  deviceViewport: DeviceViewport;
  onSelectViewport: (mode: DeviceViewport) => void;
  currentView: string;
  selectedProjectId: number;
  projectsList: { id: number; title: string }[];
  onNavigate: (view: "home" | "projects" | "about") => void;
  onSelectProject: (id: number) => void;
  onClosePreview?: () => void;
}

export function LivePreviewToolbar({
  deviceViewport,
  onSelectViewport,
  currentView,
  selectedProjectId,
  projectsList,
  onNavigate,
  onSelectProject,
  onClosePreview,
}: LivePreviewToolbarProps) {
  return (
    <aside
      aria-label="Live Preview Controls"
      className="sticky top-0 z-[9999] w-full bg-neutral-950/95 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl text-xs font-sans select-none"
    >
      {/* Left: Branding & Live Sync Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-brand-green tracking-wider uppercase flex items-center gap-1">
            <Sparkles size={11} />
            LIVE PREVIEW
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono border-l border-white/10 pl-3">
          <CheckCircle2 size={13} className="text-brand-green shrink-0" />
          <span>Real-time 0ms Auto-Sync</span>
        </div>
      </div>

      {/* Center: Device Viewport Switcher */}
      <div className="flex items-center bg-neutral-900 border border-white/10 p-1 rounded-xl shadow-inner gap-1">
        {/* Desktop Button */}
        <button
          type="button"
          onClick={() => onSelectViewport("desktop")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            deviceViewport === "desktop"
              ? "bg-brand-green text-neutral-950 shadow-md scale-102"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
          title="Desktop Mode (عرض شاشة الكمبيوتر الكاملة)"
        >
          <Monitor size={14} />
          <span className="hidden md:inline">Desktop</span>
        </button>

        {/* Tablet Button (iPad 768px) */}
        <button
          type="button"
          onClick={() => onSelectViewport("tablet")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            deviceViewport === "tablet"
              ? "bg-brand-green text-neutral-950 shadow-md scale-102"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
          title="Tablet Mode (عرض التابلت iPad - مقاس 768px)"
        >
          <Tablet size={14} />
          <span className="hidden md:inline">Tablet</span>
          <span className="text-[10px] font-mono opacity-80">(768px)</span>
        </button>

        {/* Mobile Button (iPhone 390px) */}
        <button
          type="button"
          onClick={() => onSelectViewport("mobile")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            deviceViewport === "mobile"
              ? "bg-brand-green text-neutral-950 shadow-md scale-102"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
          title="Mobile Mode (عرض الهاتف الذكي iPhone - مقاس 390px)"
        >
          <Smartphone size={14} />
          <span className="hidden md:inline">Mobile</span>
          <span className="text-[10px] font-mono opacity-80">(390px)</span>
        </button>
      </div>

      {/* Right: Quick Page Selector & Exit */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center bg-neutral-900 border border-white/10 rounded-lg p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentView === "home" ? "bg-white/15 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentView === "projects" ? "bg-white/15 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            Works
          </button>
          <button
            type="button"
            onClick={() => onNavigate("about")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              currentView === "about" ? "bg-white/15 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            About
          </button>
        </div>

        {/* Projects dropdown for quick testing */}
        {projectsList && projectsList.length > 0 && (
          <div className="relative">
            <select
              value={currentView === "project-detail" ? selectedProjectId : ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val) onSelectProject(val);
              }}
              className="bg-neutral-900 border border-white/10 text-neutral-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green cursor-pointer"
            >
              <option value="" disabled>
                Select Project...
              </option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Close Preview Mode / Return to CMS */}
        {onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            title="إغلاق شريط المعاينة والعودة"
            className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
