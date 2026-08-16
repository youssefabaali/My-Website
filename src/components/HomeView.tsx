import { useState } from "react";
import { Play, ArrowUpRight, Plus, Minus } from "lucide-react";
import { useCMS } from "../context/CMSContext";
import { motion, AnimatePresence } from "motion/react";
import { ImageFallback, fixAssetUrl } from "./ImageFallback";
import { HoverableThumbnail } from "./HoverableThumbnail";

interface HomeViewProps {
  onNavigate: (view: "home" | "projects" | "about") => void;
  onSelectProject: (id: number) => void;
  onOpenShowreel: () => void;
}

export function HomeView({
  onNavigate,
  onSelectProject,
  onOpenShowreel,
}: HomeViewProps) {
  const { data } = useCMS();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  const handleProjectClick = (id: number) => {
    onSelectProject(id);
  };

  const design = data.design || {
    layout: {
      sectionGap: 250,
      sectionGapMobile: 100,
      paddingTop: 128,
      paddingBottom: 96,
      headingGap: 24,
      headingGapMobile: 16,
      paragraphGap: 24,
    },
  };
  const gapDesktop = design.layout.sectionGap ?? 250;
  const gapTablet = Math.min(Math.max(20, Math.round(gapDesktop * 0.45)), 56);
  const gapMobile = Math.min(Math.max(16, Math.round(gapDesktop * 0.25)), 36);

  const pyTopDesktop = design.layout.paddingTop ?? 128;
  const pyBottomDesktop = design.layout.paddingBottom ?? pyTopDesktop;
  const pyTopTablet = Math.min(Math.max(48, Math.round(pyTopDesktop * 0.65)), 80);
  const pyBottomTablet = Math.min(Math.max(40, Math.round(pyBottomDesktop * 0.65)), 72);
  const pyTopMobile = Math.min(Math.max(32, Math.round(pyTopDesktop * 0.4)), 48);
  const pyBottomMobile = Math.min(Math.max(28, Math.round(pyBottomDesktop * 0.4)), 44);

  const headingGap = design.layout.headingGap ?? 24;
  const headingGapTablet = Math.min(Math.max(14, Math.round(headingGap * 0.75)), 20);
  const headingGapMobile = Math.min(Math.max(10, Math.round(headingGap * 0.5)), 16);

  const titles = data.homeTitles || {};
  const visibility = data.homeVisibility || {};

  // Track expanded accordion items (default: all expanded or first one expanded)
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    "0": true,
    "1": true,
    "2": true,
  });

  const toggleService = (index: number) => {
    setExpandedServices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full cms-home-padding"
    >
      {/* Dynamic spacing CSS variables for smooth live response to CMS sliders */}
      <style>{`
        .cms-section-gap {
          margin-bottom: ${gapMobile}px;
        }
        @media (min-width: 768px) {
          .cms-section-gap {
            margin-bottom: ${gapTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-section-gap {
            margin-bottom: ${gapDesktop}px;
          }
        }

        .cms-heading-gap {
          margin-bottom: ${headingGapMobile}px;
        }
        @media (min-width: 768px) {
          .cms-heading-gap {
            margin-bottom: ${headingGapTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-heading-gap {
            margin-bottom: ${headingGap}px;
          }
        }

        .cms-see-other-work-spacing {
          margin-top: ${gapMobile}px;
        }
        @media (min-width: 768px) {
          .cms-see-other-work-spacing {
            margin-top: ${gapTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-see-other-work-spacing {
            margin-top: ${gapDesktop}px;
          }
        }

        .cms-featured-gap {
          gap: ${gapMobile}px;
        }
        @media (min-width: 768px) {
          .cms-featured-gap {
            gap: ${gapTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-featured-gap {
            gap: ${gapDesktop}px;
          }
        }

        .cms-home-padding {
          padding-top: ${pyTopMobile}px;
          padding-bottom: ${pyBottomMobile}px;
        }
        @media (min-width: 768px) {
          .cms-home-padding {
            padding-top: ${pyTopTablet}px;
            padding-bottom: ${pyBottomTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-home-padding {
            padding-top: ${pyTopDesktop}px;
            padding-bottom: ${pyBottomDesktop}px;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════ */}
      {visibility.hero !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
            <motion.div
              variants={itemVariants}
              className="w-full flex items-center justify-center overflow-visible"
            >
              <picture className="w-full flex justify-center">
                {data.heroImageMobile && (
                  <source media="(max-width: 640px)" srcSet={fixAssetUrl(data.heroImageMobile)} />
                )}
                <img
                  src={fixAssetUrl(data.heroImage)}
                  alt="Youssef Abaali - Motion Graphics"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-auto object-contain mx-auto select-none transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           SHOWREEL SECTION
      ══════════════════════════════════════════ */}
      {visibility.showreel !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
            {titles.showreel && (
              <motion.p
                variants={itemVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-120px" }}
                className="font-bebas text-3xl sm:text-4xl md:text-[45px] tracking-widest text-brand-green cms-heading-gap"
              >
                {titles.showreel}
              </motion.p>
            )}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="w-full overflow-hidden group cursor-pointer relative"
              onClick={onOpenShowreel}
            >
              <ImageFallback
                src={data.showreel.thumbnail}
                alt="Showreel — ¿QUÉ ES? SHOWREEL ¿PORQUE DEBERIA TENER UNO?"
                fallbackType="showreel"
                className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-103"
              />
              {/* Overlay and play button */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-green/90 group-hover:bg-brand-green text-brand-black flex items-center justify-center shadow-[0_0_35px_rgba(140,255,46,0.5)] transition-all duration-300 group-hover:scale-110">
                  <Play size={32} className="ml-1 fill-brand-black text-brand-black" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           FEATURED WORK
      ══════════════════════════════════════════ */}
      {visibility.featuredWork !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
            <motion.p
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="font-bebas text-3xl sm:text-4xl md:text-[45px] tracking-widest text-brand-green cms-heading-gap"
            >
              {titles.featuredWork || "FEATURED WORK"}
            </motion.p>

            <div className="flex flex-col cms-featured-gap">
              {data.projects.filter(p => p.isPublished !== false).map((project, index) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-120px" }}
                  className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 pt-8 ${
                    !project.imageLeft ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    className="w-full md:w-[58%] overflow-hidden bg-brand-card cursor-pointer text-left focus:outline-none"
                  >
                    <HoverableThumbnail
                      thumbnail={project.thumbnail}
                      title={project.title}
                      category={project.category}
                      hoverGif={project.hoverGif}
                      hoverVideo={project.hoverVideo}
                      gifMode={Boolean(project.gifModes?.[project.thumbnail])}
                      priority={index < 2}
                      className="w-full aspect-[16/10]"
                    />
                  </button>

                  {/* Info */}
                  <div className="w-full md:w-[42%] flex flex-col gap-4 text-left">
                    <span className="text-brand-green font-grotesk text-xs tracking-widest uppercase font-semibold">
                      {project.category}
                    </span>
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className="text-left focus:outline-none cursor-pointer"
                    >
                      <h3 className="font-bebas text-3xl sm:text-4xl md:text-[48px] tracking-wider text-white hover:text-brand-green transition-colors duration-200">
                        {project.title}
                      </h3>
                    </button>
                    <p className="font-grotesk text-xs sm:text-[13px] tracking-wider leading-relaxed text-white/70 uppercase max-w-lg">
                      {project.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="flex justify-center cms-see-other-work-spacing"
            >
              <button
                onClick={() => onNavigate("projects")}
                className="flex items-center gap-3 bg-brand-green text-brand-black font-grotesk font-bold text-sm tracking-widest uppercase px-8 py-4 cursor-pointer hover:bg-white transition-all duration-300 shadow-lg"
              >
                See Other Work
                <ArrowUpRight size={16} />
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           SERVICES & EXPERTISE (Studio Minimal Rows / Accordion)
      ══════════════════════════════════════════ */}
      {visibility.services !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
            <motion.p
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="font-bebas text-3xl sm:text-4xl md:text-[45px] tracking-widest text-brand-green cms-heading-gap"
            >
              {titles.services || "SERVICES & EXPERTISE"}
            </motion.p>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="flex flex-col border-t border-white/10 w-full"
            >
              {data.services.map((service, idx) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  className="border-b border-white/10 py-6 sm:py-8 px-2 sm:px-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 group transition-colors duration-300 hover:bg-white/[0.02] cursor-default"
                >
                  {/* Left Side: Number Index + Service Title */}
                  <div className="flex items-baseline gap-3 sm:gap-6 min-w-[240px] sm:min-w-[280px] shrink-0 transition-transform duration-300 group-hover:translate-x-2">
                    <span className="font-mono text-xs text-neutral-500 font-bold tracking-widest">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bebas text-xl sm:text-2xl md:text-3xl tracking-widest text-white group-hover:text-brand-green transition-colors duration-300 uppercase">
                      {service.title}
                    </span>
                  </div>

                  {/* Middle: Integrated Skills Tags & Badges */}
                  <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {service.items.map((item) => (
                      <span
                        key={item}
                        className="font-grotesk text-xs sm:text-[13px] font-medium tracking-wider text-white/60 group-hover:text-white uppercase px-3 py-1.5 bg-brand-card/40 border border-white/5 group-hover:border-white/15 flex items-center gap-2 transition-all duration-300"
                      >
                        <span className="w-1.5 h-1.5 bg-brand-green shrink-0 opacity-70 group-hover:opacity-100" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>

                  {/* Right: Studio Arrow Indicator */}
                  <div className="hidden lg:flex w-9 h-9 sm:w-11 sm:h-11 shrink-0 items-center justify-center border border-white/10 group-hover:border-brand-green group-hover:bg-brand-green text-white/40 group-hover:text-brand-black transition-all duration-300">
                    <ArrowUpRight
                      size={20}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           CONTACT CTA
      ══════════════════════════════════════════ */}
      {visibility.contactCta !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16 flex items-center justify-center overflow-visible">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="w-full flex items-center justify-center"
            >
              <picture className="w-full flex justify-center">
                {data.myInfoMobile ? (
                  <source media="(max-width: 640px)" srcSet={data.myInfoMobile} />
                ) : (
                  <source media="(max-width: 640px)" srcSet="/src/assets/images/myInfo-Mobile.png" />
                )}
                <img
                  src={data.myInfo || "/src/assets/images/myInfo.jpg"}
                  alt="Youssef Abaali - Contact Info"
                  className="w-full h-auto object-contain mx-auto select-none transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           SOCIALS — "I'M ALL OVER THE INTERNET"
      ══════════════════════════════════════════ */}
      {visibility.socials !== false && (
        <section className="w-full cms-section-gap">
          <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
            <motion.p
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="font-bebas text-3xl sm:text-4xl md:text-[45px] tracking-widest text-brand-green cms-heading-gap"
            >
              {titles.socials || "I'M ALL OVER THE INTERNET"}
            </motion.p>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-120px" }}
              className="flex flex-col border-t border-white/10 w-full"
            >
              {data.socials.map((social, idx) => (
                <motion.a
                  key={social.name}
                  variants={itemVariants}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-white/10 py-5 sm:py-7 flex items-center justify-between group transition-colors duration-300 hover:bg-white/[0.02] px-2 sm:px-4 cursor-pointer"
                >
                  {/* Left Side: Number Index + Social Title */}
                  <div className="flex items-baseline gap-3 sm:gap-6 transition-transform duration-300 group-hover:translate-x-3">
                    <span className="font-mono text-xs text-neutral-500 font-bold tracking-widest">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bebas text-lg sm:text-xl md:text-2xl tracking-widest text-white group-hover:text-brand-green transition-colors duration-300 uppercase">
                      {social.name}
                    </span>
                  </div>

                  {/* Right Side: Platform Icon + Arrow */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <img
                        src={social.icon}
                        alt={social.name}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-white/10 group-hover:border-brand-green group-hover:bg-brand-green text-white/60 group-hover:text-brand-black transition-all duration-300">
                      <ArrowUpRight
                        size={20}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </motion.div>
  );
}
