import { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomeView } from "./components/HomeView";
import { ProjectsView } from "./components/ProjectsView";
import { ProjectDetailView } from "./components/ProjectDetailView";
import { AboutView } from "./components/AboutView";
import { VideoModal } from "./components/VideoModal";
import { AdminLogin } from "./components/AdminLogin";
import { AdminCMS } from "./components/AdminCMS";
import { CMSErrorBoundary } from "./components/CMSErrorBoundary";
import { LivePreviewToolbar, DeviceViewport } from "./components/LivePreviewToolbar";
import { useCMS } from "./context/CMSContext";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "motion/react";
import { Smartphone, Monitor } from "lucide-react";

export default function App() {
  const { data, isLoading, isAdmin } = useCMS();
  const [currentView, setCurrentView] = useState<"home" | "projects" | "about" | "project-detail" | "admin">("home");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Live Preview Device Viewport Switcher State
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("preview") === "true" || window.name === "LivePortfolioPreview";
    }
    return false;
  });
  const [deviceViewport, setDeviceViewport] = useState<DeviceViewport>("desktop");

  // Scroll progress for top indicator bar
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.0001
  });

  const progressWidth = useTransform(smoothProgress, (v) => `${Math.max(0, Math.min(100, v * 100))}%`);
  const progressOpacity = useTransform(smoothProgress, (v) => (v < 0.003 ? 0 : 1));

  // Synchronize state with URL hash & update dynamic Page Title & Meta Tags
  useEffect(() => {
    const handleHashChange = () => {
      const hash = (window.location.hash || "").toLowerCase().trim();
      const search = (window.location.search || "").toLowerCase().trim();

      if (
        hash === "#admin" ||
        hash === "#cms" ||
        hash.startsWith("#admin/") ||
        hash.startsWith("#cms/") ||
        search.includes("admin=true") ||
        search.includes("cms=true") ||
        search.includes("view=admin")
      ) {
        setCurrentView("admin");
        document.title = `CMS Admin Panel — ${data?.name || "Youssef Abaali"}`;
        window.scrollTo(0, 0);
        return;
      }

      if (hash.startsWith("#project/")) {
        const id = parseInt(hash.replace("#project/", ""), 10);
        if (!isNaN(id)) {
          setSelectedProjectId(id);
          setCurrentView("project-detail");
          
          const currentProject = data?.projects?.find((p) => p.id === id);
          if (currentProject) {
            document.title = `${currentProject.title} — ${data?.name || "Youssef Abaali"}`;
            
            // Dynamic OG tag updates
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute("content", `${currentProject.title} — ${data?.name || "Youssef Abaali"}`);
            
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc && currentProject.description) {
              ogDesc.setAttribute("content", currentProject.description);
            }

            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute("content", `${currentProject.title} — ${data?.name || "Youssef Abaali"}`);

            const twitterDesc = document.querySelector('meta[name="twitter:description"]');
            if (twitterDesc && currentProject.description) {
              twitterDesc.setAttribute("content", currentProject.description);
            }
          }
          window.scrollTo(0, 0);
          return;
        }
      }

      if (hash === "#projects") {
        setCurrentView("projects");
        document.title = `Projects — ${data?.name || "Youssef Abaali"} Portfolio`;
      } else if (hash === "#about") {
        setCurrentView("about");
        document.title = `About & Contact — ${data?.name || "Youssef Abaali"}`;
      } else {
        setCurrentView("home");
        document.title = `${data?.name || "Youssef Abaali"} — ${data?.title || "Motion Graphics Designer"}`;
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    // Trigger on initial load
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [data]);

  // Update URL hash when state is triggered programmatically
  const handleNavigation = (view: "home" | "projects" | "about") => {
    if (view === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = `#${view}`;
    }
  };

  const handleSelectProject = (id: number) => {
    window.location.hash = `#project/${id}`;
  };

  const handleBackToProjects = () => {
    window.location.hash = "#projects";
  };

  // Sync root CSS variables with CMS dynamic theme settings
  useEffect(() => {
    const root = document.documentElement;
    if (currentView === "admin") {
      // Force admin theme on root when viewing CMS
      root.style.setProperty("--brand-green", "#8cff2e");
      root.style.setProperty("--brand-black", "#131313");
      root.style.setProperty("--brand-white", "#ffffff");
      root.style.setProperty("--brand-card", "#1a1a1a");
      root.style.setProperty("--brand-footer", "#c8c5ae");
      root.style.setProperty("--brand-accent", "#8cff2e");
      root.style.setProperty("--brand-border", "#262626");
      root.style.setProperty("--brand-button-bg", "#8cff2e");
      root.style.setProperty("--brand-button-text", "#131313");
      root.style.setProperty("--brand-muted", "#a3a3a3");
      root.style.setProperty("--brand-nav-bg", "#131313");
      root.style.setProperty("--brand-nav-text", "#ffffff");
      root.style.setProperty("--brand-badge-bg", "#262626");
      root.style.setProperty("--brand-badge-text", "#8cff2e");
    } else if (data?.design?.colors) {
      const c = data.design.colors;
      const primary = c.primary || "#8cff2e";
      const bg = c.background || "#131313";
      const text = c.text || "#ffffff";
      const card = c.card || "#1a1a1a";
      const footer = c.footer || "#c8c5ae";
      const accent = c.accent || primary;
      const border = c.border || "#262626";
      const buttonBg = c.buttonBg || primary;
      const buttonText = c.buttonText || "#131313";
      const mutedText = c.mutedText || "#a3a3a3";
      const navBg = c.navBg || bg;
      const navText = c.navText || text;
      const badgeBg = c.badgeBg || "#262626";
      const badgeText = c.badgeText || primary;

      root.style.setProperty("--brand-green", primary);
      root.style.setProperty("--brand-black", bg);
      root.style.setProperty("--brand-white", text);
      root.style.setProperty("--brand-card", card);
      root.style.setProperty("--brand-footer", footer);
      root.style.setProperty("--brand-accent", accent);
      root.style.setProperty("--brand-border", border);
      root.style.setProperty("--brand-button-bg", buttonBg);
      root.style.setProperty("--brand-button-text", buttonText);
      root.style.setProperty("--brand-muted", mutedText);
      root.style.setProperty("--brand-nav-bg", navBg);
      root.style.setProperty("--brand-nav-text", navText);
      root.style.setProperty("--brand-badge-bg", badgeBg);
      root.style.setProperty("--brand-badge-text", badgeText);

      if (data?.design?.typography) {
        root.style.setProperty("--font-bebas", `"${data.design.typography.headingFont}", sans-serif`);
        root.style.setProperty("--font-grotesk", `"${data.design.typography.bodyFont}", sans-serif`);
      }
    }
  }, [data?.design, currentView]);

  // Check if we are in the secret admin area
  if (currentView === "admin") {
    return isAdmin ? (
      <CMSErrorBoundary>
        <AdminCMS />
      </CMSErrorBoundary>
    ) : (
      <AdminLogin
        onBackToSite={() => {
          window.location.hash = "";
          setCurrentView("home");
        }}
      />
    );
  }

  // Construct dynamic design variables
  const colors = data?.design?.colors || {
    primary: "#8cff2e",
    background: "#131313",
    text: "#ffffff",
    card: "#1a1a1a",
    footer: "#c8c5ae",
    accent: "#8cff2e",
    border: "#262626",
    buttonBg: "#8cff2e",
    buttonText: "#131313",
    mutedText: "#a3a3a3",
    navBg: "#131313",
    navText: "#ffffff",
    badgeBg: "#262626",
    badgeText: "#8cff2e",
  };

  const typography = data?.design?.typography || {
    headingFont: "Bebas Neue",
    bodyFont: "Space Grotesk",
  };

  const styleVars = {
    "--brand-green": colors.primary || "#8cff2e",
    "--brand-black": colors.background || "#131313",
    "--brand-white": colors.text || "#ffffff",
    "--brand-card": colors.card || "#1a1a1a",
    "--brand-footer": colors.footer || "#c8c5ae",
    "--brand-accent": colors.accent || colors.primary || "#8cff2e",
    "--brand-border": colors.border || "#262626",
    "--brand-button-bg": colors.buttonBg || colors.primary || "#8cff2e",
    "--brand-button-text": colors.buttonText || "#131313",
    "--brand-muted": colors.mutedText || "#a3a3a3",
    "--brand-nav-bg": colors.navBg || colors.background || "#131313",
    "--brand-nav-text": colors.navText || colors.text || "#ffffff",
    "--brand-badge-bg": colors.badgeBg || "#262626",
    "--brand-badge-text": colors.badgeText || colors.primary || "#8cff2e",
    "--font-bebas": `"${typography.headingFont || "Bebas Neue"}", sans-serif`,
    "--font-grotesk": `"${typography.bodyFont || "Space Grotesk"}", sans-serif`,
  } as React.CSSProperties;

  const projectsList = (data?.allProjects || data?.projects || []).map((p) => ({
    id: p.id,
    title: p.title || `Project #${p.id}`,
  }));

  // Reusable Main Portfolio Views Component
  const renderPortfolioContent = () => (
    <div className="w-full flex-1 flex flex-col bg-brand-black relative">
      {/* Header / Navbar */}
      <Navbar currentView={currentView} onNavigate={handleNavigation} />

      {/* Main Container - Page transition animations */}
      <div className="flex-1 flex flex-col w-full relative">
        <AnimatePresence mode="wait">
          <motion.main
            key={currentView === "project-detail" ? `detail-${selectedProjectId}` : currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: "easeInOut" }}
            className="flex-1 w-full flex flex-col"
          >
            {currentView === "home" && (
              <HomeView
                onNavigate={handleNavigation}
                onSelectProject={handleSelectProject}
                onOpenShowreel={() => setIsVideoOpen(true)}
              />
            )}

            {currentView === "projects" && (
              <ProjectsView onSelectProject={handleSelectProject} />
            )}

            {currentView === "project-detail" && (
              <ProjectDetailView
                projectId={selectedProjectId}
                onBack={handleBackToProjects}
              />
            )}

            {currentView === "about" && <AboutView />}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <Footer onNavigate={handleNavigation} />

      {/* Interactive Showreel Video Modal */}
      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={data.showreel?.videoUrl || ""}
      />
    </div>
  );

  // If this window is inside an isolated simulation iframe (e.g. #standalone-view), render only clean portfolio
  const isInsideIframe = typeof window !== "undefined" && window.location.search.includes("standalone=true");

  if (isInsideIframe) {
    return (
      <div
        style={styleVars}
        className="min-h-screen bg-brand-black text-brand-white flex flex-col font-grotesk overflow-x-hidden select-none selection:bg-brand-green selection:text-brand-black"
      >
        {renderPortfolioContent()}
      </div>
    );
  }

  // Iframe ref for direct postMessage dispatching
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Send latest state to iframe when data changes or device viewport is toggled
  useEffect(() => {
    if (isPreviewMode && (deviceViewport === "tablet" || deviceViewport === "mobile")) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage({ type: "SYNC_DATA", payload: data }, "*");
        } catch (e) {
          // ignore
        }
      }
    }
  }, [data, deviceViewport, isPreviewMode]);

  // Determine current active preview iframe URL
  const iframeTargetUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?standalone=true${
        currentView === "project-detail"
          ? `#project/${selectedProjectId}`
          : currentView === "projects"
          ? "#projects"
          : currentView === "about"
          ? "#about"
          : ""
      }`
    : "";

  return (
    <div
      style={styleVars}
      className="min-h-screen bg-brand-black text-brand-white flex flex-col font-grotesk overflow-x-hidden select-none selection:bg-brand-green selection:text-brand-black"
    >
      {/* Dynamic scroll progress bar indicator */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] bg-brand-green z-[200] shadow-[0_0_8px_var(--color-brand-green)] pointer-events-none rounded-r-sm"
        style={{ width: progressWidth, opacity: progressOpacity }}
      />

      {/* Top Live Preview Toolbar (Sticky ONLY in Live Preview Window) */}
      {isPreviewMode && (
        <LivePreviewToolbar
          deviceViewport={deviceViewport}
          onSelectViewport={setDeviceViewport}
          currentView={currentView}
          selectedProjectId={selectedProjectId}
          projectsList={projectsList}
          onNavigate={handleNavigation}
          onSelectProject={handleSelectProject}
          onClosePreview={() => setIsPreviewMode(false)}
        />
      )}

      {/* Viewport Rendering: Desktop (Full Native) / Tablet (768px Iframe) / Mobile (390px Iframe) */}
      {!isPreviewMode || deviceViewport === "desktop" ? (
        <div className="w-full flex-1 flex flex-col">
          {renderPortfolioContent()}
        </div>
      ) : deviceViewport === "tablet" ? (
        <div className="w-full flex-1 bg-[#090909] py-8 px-4 flex flex-col items-center justify-start min-h-[calc(100vh-60px)] overflow-y-auto">
          <div className="w-[768px] max-w-full h-[90vh] bg-brand-black border-[12px] border-neutral-800 rounded-[36px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative my-auto">
            {/* iPad Top Bezel Bar */}
            <div className="w-full bg-neutral-800 py-2.5 px-6 flex items-center justify-between border-b border-white/5 select-none shrink-0">
              <div className="text-[10px] text-neutral-400 font-mono font-bold tracking-wider">
                TABLET PREVIEW • 768px (iPad)
              </div>
              <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-700 shadow-inner" />
              <div className="text-[10px] text-brand-green font-mono font-bold">100%</div>
            </div>

            {/* True Isolated 768px Iframe */}
            <iframe
              ref={iframeRef}
              src={iframeTargetUrl}
              className="w-full flex-1 border-0 bg-brand-black"
              title="iPad Tablet Real-time Preview"
              onLoad={() => {
                try {
                  iframeRef.current?.contentWindow?.postMessage({ type: "SYNC_DATA", payload: data }, "*");
                } catch (e) {
                  // ignore
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 bg-[#090909] py-8 px-4 flex flex-col items-center justify-start min-h-[calc(100vh-60px)] overflow-y-auto">
          <div className="w-[390px] max-w-full h-[88vh] bg-brand-black border-[12px] border-neutral-800 rounded-[48px] shadow-[0_35px_100px_rgba(0,0,0,0.98)] overflow-hidden flex flex-col relative my-auto">
            {/* iPhone Dynamic Island Notch Header */}
            <div className="w-full bg-neutral-900 pt-3 pb-2 px-6 flex items-center justify-between border-b border-white/5 select-none shrink-0">
              <span className="text-[11px] font-bold text-neutral-300 font-mono">09:41</span>
              <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-center gap-2 border border-white/10 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <div className="w-2 h-2 rounded-full bg-blue-950/90 border border-blue-500/40" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-mono">
                <span className="text-[9px] font-bold text-brand-green">5G</span>
                <div className="w-4 h-2.5 rounded-xs border border-neutral-400 p-0.5 flex items-center">
                  <div className="w-full h-full bg-brand-green rounded-2xs" />
                </div>
              </div>
            </div>

            {/* True Isolated 390px Iframe */}
            <iframe
              ref={iframeRef}
              src={iframeTargetUrl}
              className="w-full flex-1 border-0 bg-brand-black"
              title="iPhone Mobile Real-time Preview"
              onLoad={() => {
                try {
                  iframeRef.current?.contentWindow?.postMessage({ type: "SYNC_DATA", payload: data }, "*");
                } catch (e) {
                  // ignore
                }
              }}
            />

            {/* iPhone Bottom Home Indicator Bar */}
            <div className="w-full bg-brand-black py-2 flex justify-center border-t border-white/5 shrink-0">
              <div className="w-32 h-1 bg-neutral-600 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

