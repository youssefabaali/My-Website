import { useState, useEffect } from "react";
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
import { LivePreviewToolbar } from "./components/LivePreviewToolbar";
import { useCMS } from "./context/CMSContext";
import { CMSSiteData } from "./types/cms";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "motion/react";

export default function App() {
  const { data, isAdmin } = useCMS();
  const [currentView, setCurrentView] = useState<"home" | "projects" | "about" | "project-detail" | "admin">("home");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // ══════════════════════════════════════════
  // ISOLATED LIVE PREVIEW MODE DETECTION
  // ══════════════════════════════════════════
  const isPreviewMode = typeof window !== "undefined" && window.location.search.includes("preview=true");
  const isStandalonePreviewWindow = isPreviewMode && typeof window !== "undefined" && window.self === window.top;
  const [previewData, setPreviewData] = useState<CMSSiteData | null>(() => {
    if (isPreviewMode && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cms_live_preview_data");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [isPreviewLandscape, setIsPreviewLandscape] = useState(false);

  // Live preview message listener (only active when preview=true)
  useEffect(() => {
    if (!isPreviewMode) return;

    const handlePreviewMessage = (e: MessageEvent) => {
      try {
        if (e.data && e.data.type === "CMS_PREVIEW_SYNC" && e.data.payload) {
          setPreviewData(e.data.payload);
        }
      } catch (err) {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cms_live_preview_data" && e.newValue) {
        try {
          setPreviewData(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener("message", handlePreviewMessage);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("message", handlePreviewMessage);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isPreviewMode]);

  // Active data selection (isolated previewData when previewing, or normal standard data)
  const activeData = (isPreviewMode && previewData) ? previewData : data;

  // Scroll progress for top indicator bar
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.0001,
  });

  const progressWidth = useTransform(smoothProgress, (v) => `${Math.max(0, Math.min(100, v * 100))}%`);
  const progressOpacity = useTransform(smoothProgress, (v) => (v < 0.003 ? 0 : 1));

  // Synchronize state with URL hash & update dynamic Page Title & Meta Tags
  useEffect(() => {
    const handleHashChange = () => {
      const hash = (window.location.hash || "").toLowerCase().trim();
      const search = (window.location.search || "").toLowerCase().trim();

      // Only enter admin if NOT in preview mode or explicitly admin
      if (
        !isPreviewMode && (
          hash === "#admin" ||
          hash === "#cms" ||
          hash.startsWith("#admin/") ||
          hash.startsWith("#cms/") ||
          search.includes("admin=true") ||
          search.includes("cms=true") ||
          search.includes("view=admin")
        )
      ) {
        setCurrentView("admin");
        document.title = `CMS Admin Panel — ${activeData?.name || "Youssef Abaali"}`;
        window.scrollTo(0, 0);
        return;
      }

      if (hash.startsWith("#project/")) {
        const id = parseInt(hash.replace("#project/", ""), 10);
        if (!isNaN(id)) {
          setSelectedProjectId(id);
          setCurrentView("project-detail");

          const currentProject = (activeData?.allProjects || activeData?.projects || []).find((p) => p.id === id);
          const projectDetail = activeData?.projectDetails?.find((p) => p.id === id);
          const projectDesc = projectDetail?.description || (currentProject as any)?.description || "";

          if (currentProject) {
            document.title = `${currentProject.title} — ${activeData?.name || "Youssef Abaali"}`;

            // Dynamic OG tag updates
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute("content", `${currentProject.title} — ${activeData?.name || "Youssef Abaali"}`);

            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc && projectDesc) {
              ogDesc.setAttribute("content", projectDesc);
            }

            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute("content", `${currentProject.title} — ${activeData?.name || "Youssef Abaali"}`);

            const twitterDesc = document.querySelector('meta[name="twitter:description"]');
            if (twitterDesc && projectDesc) {
              twitterDesc.setAttribute("content", projectDesc);
            }
          }
          window.scrollTo(0, 0);
          return;
        }
      }

      if (hash === "#projects") {
        setCurrentView("projects");
        document.title = `Projects — ${activeData?.name || "Youssef Abaali"} Portfolio`;
      } else if (hash === "#about") {
        setCurrentView("about");
        document.title = `About & Contact — ${activeData?.name || "Youssef Abaali"}`;
      } else {
        setCurrentView("home");
        document.title = `${activeData?.name || "Youssef Abaali"} — ${activeData?.title || "Motion Graphics Designer"}`;
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
  }, [activeData, isPreviewMode]);

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

  // Sync root CSS variables with dynamic theme settings
  useEffect(() => {
    const root = document.documentElement;
    if (activeData?.design?.colors) {
      const c = activeData.design.colors;
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

      if (activeData?.design?.typography) {
        root.style.setProperty("--font-bebas", `"${activeData.design.typography.headingFont}", sans-serif`);
        root.style.setProperty("--font-grotesk", `"${activeData.design.typography.bodyFont}", sans-serif`);
      }
    }
  }, [activeData?.design, currentView]);

  // Check if we are in the secret admin area (only when NOT in preview mode)
  if (!isPreviewMode && currentView === "admin") {
    return (
      <CMSErrorBoundary>
        {isAdmin ? (
          <AdminCMS />
        ) : (
          <AdminLogin
            onBackToSite={() => {
              window.location.hash = "";
              setCurrentView("home");
            }}
          />
        )}
      </CMSErrorBoundary>
    );
  }

  // Construct dynamic design variables
  const colors = activeData?.design?.colors || {
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

  const typography = activeData?.design?.typography || {
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

  // Viewport calculation for standalone popout preview window
  const getStandalonePreviewWidth = () => {
    if (!isStandalonePreviewWindow || previewDevice === "desktop") return "100%";
    if (previewDevice === "laptop") return "1200px";
    if (previewDevice === "tablet") return isPreviewLandscape ? "1024px" : "768px";
    if (previewDevice === "mobile") return isPreviewLandscape ? "844px" : "390px";
    return "100%";
  };

  return (
    <div
      style={styleVars}
      className={`min-h-screen bg-brand-black text-brand-white flex flex-col font-grotesk overflow-x-hidden select-none selection:bg-brand-green selection:text-brand-black ${
        isStandalonePreviewWindow && previewDevice !== "desktop" ? "py-16 px-4 bg-neutral-950 flex items-center justify-start min-h-screen" : ""
      }`}
    >
      {/* Standalone Preview Floating Toolbar */}
      {isStandalonePreviewWindow && (
        <LivePreviewToolbar
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          isLandscape={isPreviewLandscape}
          onToggleOrientation={() => setIsPreviewLandscape(!isPreviewLandscape)}
          onRefresh={() => {
            try {
              const stored = localStorage.getItem("cms_live_preview_data");
              if (stored) setPreviewData(JSON.parse(stored));
            } catch (e) {}
          }}
          onExitPreview={() => {
            window.location.search = "";
          }}
        />
      )}

      {/* Main Viewport Container */}
      <div
        className={`w-full flex flex-col flex-1 transition-all duration-300 ${
          isStandalonePreviewWindow && previewDevice !== "desktop"
            ? "mx-auto rounded-2xl border-4 border-neutral-800 shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden bg-brand-black"
            : ""
        }`}
        style={{
          width: getStandalonePreviewWidth(),
          maxWidth: "100%",
        }}
      >
        {/* Dynamic scroll progress bar indicator */}
        <motion.div
          className="fixed top-0 left-0 h-[3px] bg-brand-green z-[200] shadow-[0_0_8px_var(--color-brand-green)] pointer-events-none rounded-r-sm"
          style={{ width: progressWidth, opacity: progressOpacity }}
        />

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
      </div>

      {/* Interactive Showreel Video Modal */}
      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={activeData?.showreel?.videoUrl || ""}
      />
    </div>
  );
}
