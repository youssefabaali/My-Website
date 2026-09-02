import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { ImageFallback } from "./ImageFallback";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: "home" | "projects" | "about") => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLinkClick = (view: "home" | "projects" | "about") => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Full screen subtle backdrop blur overlay for mobile navigation */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isOpen
            ? "bg-brand-black/95 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl"
            : isScrolled
            ? "bg-brand-nav-bg/90 backdrop-blur-md border-b border-brand-border/30 shadow-lg py-4"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleLinkClick("home")}
            className="flex items-center gap-2 cursor-pointer focus:outline-none z-10"
          >
            <ImageFallback
              src="assets/images/Logo.png"
              alt="Youssef Abaali Logo"
              fallbackType="logo"
              className="font-bebas text-2xl tracking-widest text-brand-green hover:opacity-80 transition-opacity duration-200 font-bold"
            />
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-12">
            <button
              onClick={() => handleLinkClick("projects")}
              className={`font-sans text-[14px] uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                currentView === "projects" || currentView === "project-detail"
                  ? "text-brand-green font-semibold"
                  : "text-brand-nav-text/80 hover:text-brand-green"
              }`}
            >
              Work
            </button>
            <button
              onClick={() => handleLinkClick("about")}
              className={`font-sans text-[14px] uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                currentView === "about"
                  ? "text-brand-green font-semibold"
                  : "text-brand-nav-text/80 hover:text-brand-green"
              }`}
            >
              About & Contact
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:text-brand-green transition-colors duration-200 cursor-pointer z-10 p-1"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Links Container - Directly beneath the logo & header with zero gap */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-brand-black/95 backdrop-blur-md border-b border-white/10 px-6 pt-3 pb-6 flex flex-col gap-3.5 shadow-2xl animate-fade-in">
            {/* 1. Home */}
            <button
              onClick={() => handleLinkClick("home")}
              className={`text-left font-sans text-[15px] uppercase tracking-wider py-1 transition-colors ${
                currentView === "home"
                  ? "text-brand-green font-bold"
                  : "text-white/90 hover:text-brand-green"
              }`}
            >
              Home
            </button>

            {/* 2. Work */}
            <button
              onClick={() => handleLinkClick("projects")}
              className={`text-left font-sans text-[15px] uppercase tracking-wider py-1 transition-colors ${
                currentView === "projects" || currentView === "project-detail"
                  ? "text-brand-green font-bold"
                  : "text-white/90 hover:text-brand-green"
              }`}
            >
              Work
            </button>

            {/* 3. About & Contact */}
            <button
              onClick={() => handleLinkClick("about")}
              className={`text-left font-sans text-[15px] uppercase tracking-wider py-1 transition-colors ${
                currentView === "about"
                  ? "text-brand-green font-bold"
                  : "text-white/90 hover:text-brand-green"
              }`}
            >
              About & Contact
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
