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
import { StandalonePreview } from "./components/StandalonePreview";
import { useCMS } from "./context/CMSContext";
import { CMSSiteData } from "./types/cms";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "motion/react";

export default function App() {
  const { data, isAdmin } = useCMS();
  const [currentView, setCurrentView] = useState<"home" | "projects" | "about" | "project-detail" | "admin">("home");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // ═════════════════════════════════════════════════════════════
  // 1. STANDALONE PREVIEW STUDIO MODE CHECK
  // ═════════════════════════════════════════════════════════════
  const searchParams = typeof window !== "undefined" ? window.location.search : "";
  const isStandaloneStudio = searchParams.includes("preview_mode=standalone") || searchParams.includes("preview=standalone");
  const isFramePreview = searchParams.includes("preview_mode=frame") || searchParams.includes("preview_mode=direct") || searchParams.includes("preview=true");

  // State for live preview data when inside frame or preview consumer
  const [livePreviewData, setLivePreviewData] = useState<CMSSiteData | null>(() => {
    if (isFramePreview && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cms_live_preview_snapshot") || localStorage.getItem("cms_portfolio_data");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });

  // Listen for live updates via postMessage & BroadcastChannel when in preview frame
  useEffect(() => {
    if (!isFramePreview) return;

    let busChannel: BroadcastChannel | null = null;

    const handleDataUpdate = (newData: CMSSiteData) => {
      if (newData) {
        setLivePreviewData(newData);
      }
    };

    // Listen to postMessage from parent standalone emulator
    const handleMessage = (e: MessageEvent) => {
      try {
        if (e.data && e.data.type === "CMS_PREVIEW_SYNC" && e.data.payload) {
          handleDataUpdate(e.data.payload);
        }
      } catch (err) {}
    };

    // Listen to BroadcastChannel
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        busChannel = new BroadcastChannel("cms_live_preview_bus");
        busChannel.onmessage = (event) => {
          if (event.data && event.data.type === "SYNC_DATA" && event.data.payload) {
            handleDataUpdate(event.data.payload);
          }
        };
      }
    } catch (e) {}

    // Listen to storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cms_live_preview_snapshot" && e.newValue) {
        try {
          handleDataUpdate(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      if (busChannel) busChannel.close();
    };
  }, [isFramePreview]);

  // If in Standalone Preview Studio, return the F12 Device Emulation Toolbar & Canvas
  if (isStandaloneStudio) {
    return <StandalonePreview />;
  }

  // Active data selection: Use live preview stream if active, else standard CMS data
  const activeData = (isFramePreview && livePreviewData) ? livePreviewData : data;

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
        !isFramePreview && (
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
  }, [activeData, isFramePreview]);

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
  if (!isFramePreview && currentView === "admin") {
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
        videoUrl={activeData?.showreel?.videoUrl || ""}
      />
    </div>
  );
}
