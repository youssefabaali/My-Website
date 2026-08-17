import { useState, useEffect } from "react";
import { useCMS } from "../context/CMSContext";
import { ArrowRight, X, ChevronLeft, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageFallback } from "./ImageFallback";

interface ProjectDetailViewProps {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetailView({ projectId, onBack }: ProjectDetailViewProps) {
  const { data } = useCMS();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideoMap, setPlayingVideoMap] = useState<Record<number, boolean>>({});

  // Find active project details
  const project = data.projectDetails.find((p) => p.id === projectId);

  useEffect(() => {
    setPlayingVideoMap({});
  }, [projectId]);

  // Find next project in the series for navigation
  const currentProjectIndex = data.projectDetails.findIndex((p) => p.id === projectId);
  const nextProject = currentProjectIndex !== -1
    ? data.projectDetails[(currentProjectIndex + 1) % data.projectDetails.length]
    : null;

  // Header videos calculation (supports video URL, hero image cover thumbnail, or both)
  const rawHeaderVideos = (project?.headerVideos && project.headerVideos.length > 0)
    ? project.headerVideos
    : [
        ...(project?.videoUrl || project?.heroImage
          ? [{ id: "v-1", url: project?.videoUrl || "", thumbnail: project?.heroImage || "" }]
          : [])
      ];

  const headerVideos = rawHeaderVideos.filter(
    (v) => (v.url && v.url.trim().length > 0) || (v.thumbnail && v.thumbnail.trim().length > 0)
  );
  const headerVideoLayout = project?.headerVideoLayout || "grid";

  // Sanitize and transform standard youtube watch url or vimeo url to embed
  const getEmbedUrl = (rawUrl: string) => {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) return "";
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      return "about:blank";
    } else if (trimmed.includes("youtube.com/embed/") || trimmed.includes("player.vimeo.com/")) {
      return trimmed;
    } else if (trimmed.includes("vimeo.com/")) {
      const vimeoIdMatch = trimmed.match(/vimeo\.com\/([0-9]+)/);
      return vimeoIdMatch && vimeoIdMatch[1]
        ? `https://player.vimeo.com/video/${vimeoIdMatch[1]}`
        : trimmed;
    } else if (trimmed.includes("youtube.com/watch") || trimmed.includes("youtu.be/")) {
      const ytIdMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
      return ytIdMatch && ytIdMatch[1]
        ? `https://www.youtube.com/embed/${ytIdMatch[1]}`
        : trimmed;
    }
    return trimmed;
  };

  // Flat list of all images across sections for lightbox navigation
  const allImages: string[] = [];
  if (project && Array.isArray(project.sections)) {
    project.sections.forEach((sec) => {
      if (sec.type === "grid" && sec.rows && sec.rows.length > 0) {
        sec.rows.forEach((r) => {
          if (Array.isArray(r.images)) {
            r.images.forEach((img) => {
              if (img) allImages.push(img);
            });
          }
        });
      } else if (sec.type === "image_text") {
        if (sec.imageSrc) allImages.push(sec.imageSrc);
        else if (Array.isArray(sec.images) && sec.images.length > 0) {
          sec.images.forEach((img) => {
            if (img) allImages.push(img);
          });
        }
      } else if (sec.type === "text") {
        // No images in pure text section
      } else if (Array.isArray(sec.images)) {
        sec.images.forEach((img) => {
          if (img) allImages.push(img);
        });
      }
    });
  }

  // Helper to determine if a given media URL is set to GIF mode (muted autoplay loop without video controls)
  const isGifModeForUrl = (url: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    if (clean.includes(".gif") || clean.startsWith("data:image/gif")) return true;
    if (project?.gifModes?.[url]) return true;
    if (!project?.sections) return false;
    for (const sec of project.sections) {
      if (sec.gifModes?.[url]) return true;
      if (sec.rows) {
        for (const r of sec.rows) {
          if (r.gifModes?.[url]) return true;
        }
      }
    }
    return false;
  };

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + allImages.length) % allImages.length : null
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % allImages.length : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  if (!project) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-6 pt-32">
        <h2 className="font-bebas text-4xl text-white tracking-widest uppercase mb-4">
          Work Not Found
        </h2>
        <button
          onClick={onBack}
          className="font-grotesk text-brand-green tracking-widest text-sm uppercase flex items-center gap-2 hover:underline"
        >
          <ChevronLeft size={16} /> Back to Work
        </button>
      </div>
    );
  }

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
  // Automatically divide spacing by 2 on mobile and tablet
  const gapTablet = Math.round(gapDesktop / 2);
  const gapMobile = Math.round(gapDesktop / 2);

  const pyTopDesktop = design.layout.paddingTop ?? 128;
  const pyBottomDesktop = design.layout.paddingBottom ?? pyTopDesktop;
  const pyTopTablet = Math.round(pyTopDesktop / 2);
  const pyBottomTablet = Math.round(pyBottomDesktop / 2);
  const pyTopMobile = Math.round(pyTopDesktop / 2);
  const pyBottomMobile = Math.round(pyBottomDesktop / 2);

  const headingGapDesktop = design.layout.headingGap ?? 24;
  const headingGapTablet = Math.round(headingGapDesktop / 2);
  const headingGapMobile = Math.round(headingGapDesktop / 2);

  const heroCover = project.heroImage || project.thumbnail;

  // Dedicated responsive spacing resolver: Desktop gets exact CMS value (num), Mobile & Tablet get exact 50% (num / 2)
  const resolveResponsiveSpacing = (val: number | string | undefined, defaultVal = 0) => {
    if (val === undefined || val === null || val === "" || val === "default") {
      val = defaultVal;
    }
    let num = 0;
    if (typeof val === "number") {
      num = val;
    } else if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "0" || trimmed === "0px" || trimmed === "none") {
        return { mobile: "0px", tablet: "0px", desktop: "0px", num: 0 };
      }
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) num = parsed;
    }

    if (num <= 0) {
      return { mobile: "0px", tablet: "0px", desktop: "0px", num: 0 };
    }

    const desktop = `${num}px`;
    const half = `${Math.round((num / 2) * 10) / 10}px`;

    return { mobile: half, tablet: half, desktop, num };
  };

  // Determine starting global index for each section's image list
  let cumulativeImageCount = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full cms-detail-page-padding"
    >
      <style>{`
        .cms-detail-page-padding {
          padding-top: ${pyTopMobile}px;
          padding-bottom: ${pyBottomMobile}px;
        }
        @media (min-width: 768px) {
          .cms-detail-page-padding {
            padding-top: ${pyTopTablet}px;
            padding-bottom: ${pyBottomTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-detail-page-padding {
            padding-top: ${pyTopDesktop}px;
            padding-bottom: ${pyBottomDesktop}px;
          }
        }

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

        .cms-detail-sections-gap {
          gap: ${gapMobile}px;
        }
        @media (min-width: 768px) {
          .cms-detail-sections-gap {
            gap: ${gapTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-detail-sections-gap {
            gap: ${gapDesktop}px;
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
            margin-bottom: ${headingGapDesktop}px;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════
           HERO TEXT SECTION
      ══════════════════════════════════════════ */}
      <section className="px-6 md:px-10 lg:px-12 xl:px-16 cms-section-gap max-w-[1920px] mx-auto">
        <button
          onClick={onBack}
          className="font-grotesk text-brand-green tracking-widest text-xs uppercase flex items-center gap-1.5 mb-10 hover:opacity-80 cursor-pointer focus:outline-none"
        >
          <ChevronLeft size={14} /> Back to Work
        </button>

        <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-16">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-[50px] font-normal tracking-wider text-white uppercase leading-none md:max-w-[55%]">
            {project.title}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-wider leading-relaxed text-white/80 uppercase md:max-w-[38%] pt-2 whitespace-pre-line">
            {project.shortDescription}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           HERO VIDEOS (SHOWREEL / INTRO VIDEOS)
      ══════════════════════════════════════════ */}
      {headerVideos.length > 0 ? (
        <section className="px-6 md:px-10 lg:px-12 xl:px-16 max-w-[1920px] mx-auto cms-section-gap">
          <div
            className={
              headerVideoLayout === "row" || headerVideos.length === 1
                ? "flex flex-col gap-6 md:gap-8 w-full"
                : "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full"
            }
          >
            {headerVideos.map((vItem, vIdx) => {
              const rawUrl = (vItem.url || "").trim();
              const embedUrl = getEmbedUrl(rawUrl);
              const vCover = (vItem.thumbnail || "").trim();
              const isPlaying = Boolean(playingVideoMap[vIdx]);

              return (
                <div
                  key={vItem.id || vIdx}
                  className="overflow-hidden bg-black aspect-video w-full relative"
                >
                  {isPlaying ? (
                    /youtube|vimeo|embed/i.test(embedUrl) ? (
                      <iframe
                        src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${project.title} Video ${vIdx + 1}`}
                      />
                    ) : (
                      <video
                        src={embedUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div
                      onClick={() => {
                        if (rawUrl) {
                          setPlayingVideoMap((prev) => ({ ...prev, [vIdx]: true }));
                        }
                      }}
                      className={`w-full h-full relative overflow-hidden flex items-center justify-center bg-neutral-900 group ${
                        rawUrl ? "cursor-pointer" : ""
                      }`}
                    >
                      {vCover ? (
                        <ImageFallback
                          src={vCover}
                          alt={`${project.title} Video Thumbnail ${vIdx + 1}`}
                          gifMode={isGifModeForUrl(vCover) || Boolean((vItem as any).gifMode)}
                          loading={vIdx === 0 ? "eager" : "lazy"}
                          decoding={vIdx === 0 ? "sync" : "async"}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-neutral-600">
                          <Play size={48} className="opacity-40" />
                        </div>
                      )}

                      {/* Show dark overlay and Play Icon when a playable video URL exists */}
                      {rawUrl && (
                        <>
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-green/90 group-hover:bg-brand-green text-brand-black flex items-center justify-center shadow-[0_0_30px_rgba(140,255,46,0.5)] transition-all duration-300 group-hover:scale-110">
                              <Play size={28} className="ml-1 fill-brand-black" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════
           PROJECT META (Dynamic Role, Client, Custom Info Fields, Description)
      ══════════════════════════════════════════ */}
      {(() => {
        const rawFields: { label: string; value: string }[] = (
          Array.isArray(project.customFields)
            ? project.customFields
            : [
                ...(project.client ? [{ label: "Client", value: project.client }] : []),
                ...(project.role ? [{ label: "My Role", value: project.role }] : []),
                ...(project.date ? [{ label: "Date", value: project.date }] : []),
              ]
        ).filter((field) => field && field.value && field.value.trim().length > 0);

        const hasDescription = Boolean(project.description && project.description.trim().length > 0);

        if (rawFields.length === 0 && !hasDescription) return null;

        // Custom bottom spacing for description: 100% on desktop, 50% on mobile/tablet
        const descSpacing = resolveResponsiveSpacing(project.descriptionBottomGap, 0);

        return (
          <section
            style={{
              marginBottom: descSpacing.desktop,
            }}
            className="px-6 md:px-10 lg:px-12 xl:px-16 max-w-[1920px] mx-auto w-full transition-all duration-300 cms-desc-gap"
          >
            <style>{`
              .cms-desc-gap {
                margin-bottom: ${descSpacing.mobile} !important;
              }
              @media (min-width: 768px) {
                .cms-desc-gap {
                  margin-bottom: ${descSpacing.tablet} !important;
                }
              }
              @media (min-width: 1024px) {
                .cms-desc-gap {
                  margin-bottom: ${descSpacing.desktop} !important;
                }
              }
            `}</style>
            {rawFields.length > 0 && (
              <div className={`flex flex-col md:flex-row md:flex-wrap justify-start md:justify-center items-start md:items-center gap-6 md:gap-12 w-full ${hasDescription ? "border-b border-white/5 pb-8 mb-6" : ""}`}>
                {rawFields.map((field, fIdx) => (
                  <div key={fIdx} className="w-full md:w-auto flex flex-col gap-1.5 pl-4 border-l-2 border-brand-green text-left">
                    <span className="font-sans text-[11px] tracking-widest text-white/50 uppercase">
                      {field.label}
                    </span>
                    <span className="font-sans text-sm font-bold tracking-wider text-white uppercase whitespace-pre-line">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Description body */}
            {hasDescription && (
              <p className="font-sans text-sm md:text-base tracking-widest text-white/75 leading-relaxed uppercase max-w-4xl mx-auto text-center whitespace-pre-line">
                {project.description}
              </p>
            )}
          </section>
        );
      })()}

      {/* ══════════════════════════════════════════
           DYNAMIC GALLERY SECTIONS
      ══════════════════════════════════════════ */}
      <section className="px-6 md:px-10 lg:px-12 xl:px-16 max-w-[1920px] mx-auto flex flex-col">
        {project.sections.map((sec, secIdx) => {
          const startingGlobalIndex = cumulativeImageCount;

          const sectionRows =
            sec.type === "grid" && sec.rows && sec.rows.length > 0
              ? sec.rows
              : sec.type === "grid"
              ? [{ images: sec.images || [] }]
              : null;

          let secImagesCount = 0;
          if (sec.type === "grid" && sec.rows && sec.rows.length > 0) {
            secImagesCount = sec.rows.flatMap((r) => r.images || []).length;
          } else if (sec.type === "image_text") {
            secImagesCount = sec.imageSrc ? 1 : (Array.isArray(sec.images) ? sec.images.length : 0);
          } else if (sec.type === "text") {
            secImagesCount = 0;
          } else if (Array.isArray(sec.images)) {
            secImagesCount = sec.images.length;
          }
          cumulativeImageCount += secImagesCount;

          // Helper to resolve custom gap/spacing values with responsive scaling: 100% Desktop, 50% Tablet/Mobile
          const getProportionalSpacing = (val: number | string | undefined, defaultVal = 0) => {
            return resolveResponsiveSpacing(val, defaultVal);
          };

          const parseSpacingValue = (val: number | string | undefined): string | undefined => {
            if (val === undefined || val === null || val === "" || val === "default") return undefined;
            if (val === 0 || val === "0" || val === "none") return "0px";
            if (val === "tight" || val === "small") return "8px";
            if (val === "medium") return "20px";
            if (val === "large") return "40px";
            if (val === "xlarge") return "64px";
            if (typeof val === "number") return `${val}px`;
            if (typeof val === "string") {
              const trimmed = val.trim();
              if (!isNaN(Number(trimmed))) return `${Number(trimmed)}px`;
              if (trimmed.endsWith("px") || trimmed.endsWith("rem") || trimmed.endsWith("em") || trimmed.endsWith("%") || trimmed.endsWith("vh")) {
                return trimmed;
              }
              return `${trimmed}px`;
            }
            return undefined;
          };

          // Dedicated helper to resolve width values correctly (percentages like 50 -> 50%, px, etc.)
          const parseWidthValue = (val: number | string | undefined): string => {
            if (val === undefined || val === null || val === "" || val === "default" || val === "100" || val === 100 || val === "100%") return "100%";
            if (typeof val === "number") {
              if (val <= 100) return `${val}%`;
              return `${val}px`;
            }
            if (typeof val === "string") {
              const trimmed = val.trim();
              if (trimmed === "100" || trimmed === "100%") return "100%";
              if (!isNaN(Number(trimmed))) {
                const n = Number(trimmed);
                if (n <= 100) return `${n}%`;
                return `${n}px`;
              }
              if (trimmed.endsWith("%") || trimmed.endsWith("px") || trimmed.endsWith("vw") || trimmed.endsWith("rem")) {
                return trimmed;
              }
              return `${trimmed}%`;
            }
            return "100%";
          };

          const sectionSpacingObj = getProportionalSpacing(sec.sectionGap, 0);
          const rowsSpacingObj = getProportionalSpacing(sec.rowsGap, 0);
          const titleTopSpacingObj = getProportionalSpacing(sec.titleTopGap, 0);
          const titleBottomSpacingObj = getProportionalSpacing(sec.titleBottomGap, 0);

          const secClass = `cms-sec-item-${secIdx}`;
          const titleClass = `cms-sec-title-${secIdx}`;
          const rowContainerClass = `cms-sec-rows-${secIdx}`;

          const hasValidLabel = Boolean(sec.label && sec.label.trim().length > 0);

          return (
            <div key={sec.label || secIdx} className={`flex flex-col w-full ${secClass}`}>
              <style>{`
                .${secClass} {
                  margin-bottom: ${sectionSpacingObj.mobile} !important;
                }
                @media (min-width: 768px) {
                  .${secClass} {
                    margin-bottom: ${sectionSpacingObj.tablet} !important;
                  }
                }
                @media (min-width: 1024px) {
                  .${secClass} {
                    margin-bottom: ${sectionSpacingObj.desktop} !important;
                  }
                }

                .${titleClass} {
                  margin-top: ${titleTopSpacingObj.mobile} !important;
                  margin-bottom: ${titleBottomSpacingObj.mobile} !important;
                }
                @media (min-width: 768px) {
                  .${titleClass} {
                    margin-top: ${titleTopSpacingObj.tablet} !important;
                    margin-bottom: ${titleBottomSpacingObj.tablet} !important;
                  }
                }
                @media (min-width: 1024px) {
                  .${titleClass} {
                    margin-top: ${titleTopSpacingObj.desktop} !important;
                    margin-bottom: ${titleBottomSpacingObj.desktop} !important;
                  }
                }

                .${rowContainerClass} {
                  row-gap: ${rowsSpacingObj.mobile} !important;
                  gap: ${rowsSpacingObj.mobile} !important;
                }
                @media (min-width: 768px) {
                  .${rowContainerClass} {
                    row-gap: ${rowsSpacingObj.tablet} !important;
                    gap: ${rowsSpacingObj.tablet} !important;
                  }
                }
                @media (min-width: 1024px) {
                  .${rowContainerClass} {
                    row-gap: ${rowsSpacingObj.desktop} !important;
                    gap: ${rowsSpacingObj.desktop} !important;
                  }
                }
              `}</style>
              {hasValidLabel && (
                <h2
                  className={`font-bebas text-3xl sm:text-4xl tracking-widest text-brand-green text-left uppercase ${titleClass}`}
                >
                  {sec.label}
                </h2>
              )}

              {sec.type === "text" ? (
                /* PURE TEXT PARAGRAPH SECTION (Configurable Alignment, Width %, Y/X Offsets) */
                (() => {
                  const alignment = sec.textAlignment || "left";
                  const alignContainerClass =
                    alignment === "center"
                      ? "items-center text-center mx-auto"
                      : alignment === "right"
                      ? "items-end text-right ml-auto"
                      : "items-start text-left mr-auto";

                  const alignTextClass =
                    alignment === "center"
                      ? "text-center"
                      : alignment === "right"
                      ? "text-right"
                      : "text-left";

                  const rawWidth = sec.textWidth;
                  const parsedWidth = (rawWidth !== undefined && rawWidth !== null && rawWidth !== "" && rawWidth !== "100%" && rawWidth !== 100 && rawWidth !== "100")
                    ? parseWidthValue(rawWidth)
                    : undefined;

                  const yOff = sec.textYOffset || 0;
                  const xOff = sec.textXOffset || 0;
                  const transformStyle = (yOff || xOff)
                    ? { transform: `translate(${xOff}px, ${yOff}px)` }
                    : undefined;

                  const textBlockStyle: React.CSSProperties = {
                    ...transformStyle,
                    ...(parsedWidth ? { width: parsedWidth, maxWidth: parsedWidth } : { maxWidth: "56rem", width: "100%" }),
                  };

                  return (
                    <div
                      style={textBlockStyle}
                      className={`flex flex-col gap-3 ${alignContainerClass} py-2 transition-transform duration-300`}
                    >
                      {sec.textTitle && (
                        <h3 className={`font-bebas text-2xl sm:text-3xl tracking-widest text-white uppercase ${alignTextClass}`}>
                          {sec.textTitle}
                        </h3>
                      )}
                      {sec.textContent && (
                        <p className={`font-sans text-sm md:text-base tracking-widest text-white/80 leading-relaxed uppercase whitespace-pre-line ${alignTextClass}`}>
                          {sec.textContent}
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : sec.type === "image_text" ? (
                /* SPLIT IMAGE + TEXT SECTION (Dynamic Image Size % Controls Column Ratio & Adapts Text Width) */
                (() => {
                  // Resolve image size % (Default 50%, supports 20% - 85% or custom numbers)
                  const rawSize = sec.imageCustomWidth !== undefined && sec.imageCustomWidth !== null && sec.imageCustomWidth !== ""
                    ? sec.imageCustomWidth
                    : (sec.imageWidthRatio || 50);

                  let imgPercent = 50;
                  if (typeof rawSize === "number") {
                    imgPercent = rawSize;
                  } else if (typeof rawSize === "string") {
                    const num = parseFloat(rawSize.replace("%", "").trim());
                    if (!isNaN(num)) imgPercent = num;
                  }

                  // Clamp image percentage between 15% and 85% for balanced layout
                  const safeImgPercent = Math.max(15, Math.min(85, imgPercent));
                  const textPercent = 100 - safeImgPercent;

                  const yOff = sec.imageYOffset || 0;
                  const xOff = sec.imageXOffset || 0;
                  const transformStyle = (yOff || xOff)
                    ? { transform: `translate(${xOff}px, ${yOff}px)` }
                    : undefined;

                  const imgButtonStyle: React.CSSProperties = {
                    ...transformStyle,
                    width: "100%",
                  };

                  return (
                    <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-center py-2 w-full">
                      {/* Image Column */}
                      <div
                        style={{ width: `${safeImgPercent}%` }}
                        className={`w-full flex justify-center ${sec.imagePosition === "right" ? "md:order-2" : "md:order-1"}`}
                      >
                        {(sec.imageSrc || (sec.images && sec.images[0])) && (
                          <button
                            onClick={() => {
                              const imgSrc = sec.imageSrc || sec.images[0];
                              const imgIdx = allImages.indexOf(imgSrc);
                              if (imgIdx !== -1) setLightboxIndex(imgIdx);
                            }}
                            style={imgButtonStyle}
                            className="overflow-hidden group cursor-pointer focus:outline-none flex items-center justify-center p-0 transition-transform duration-300"
                          >
                            <ImageFallback
                              src={sec.imageSrc || sec.images[0]}
                              alt={sec.textTitle || sec.label}
                              category={project.title}
                              gifMode={isGifModeForUrl(sec.imageSrc || sec.images[0])}
                              className="w-full h-auto max-h-[750px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          </button>
                        )}
                      </div>

                      {/* Text Column */}
                      <div
                        style={{ width: `${textPercent}%` }}
                        className={`w-full flex flex-col gap-4 text-left ${sec.imagePosition === "right" ? "md:order-1" : "md:order-2"}`}
                      >
                        {sec.textTitle && (
                          <h3 className="font-bebas text-2xl sm:text-3xl tracking-widest text-white uppercase">
                            {sec.textTitle}
                          </h3>
                        )}
                        {sec.textContent && (
                          <p className="font-sans text-sm md:text-base tracking-widest text-white/80 leading-relaxed uppercase whitespace-pre-line">
                            {sec.textContent}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : sec.type === "row" || !sectionRows ? (
                /* WIDESCREEN FULL ROW IMAGES (preserves natural aspect ratio without stretching) */
                <div
                  style={rowsSpacingObj.num > 0 ? { rowGap: rowsSpacingObj.desktop, gap: rowsSpacingObj.desktop } : undefined}
                  className={`flex flex-col ${rowsSpacingObj.num > 0 ? rowContainerClass : "gap-4 sm:gap-6 md:gap-8"} w-full`}
                >
                  {sec.images.map((imgSrc, imgIdx) => {
                    const globalIdx = startingGlobalIndex + imgIdx;
                    return (
                      <button
                        key={imgIdx}
                        onClick={() => setLightboxIndex(globalIdx)}
                        className="overflow-hidden group cursor-pointer focus:outline-none w-full flex items-center justify-center p-0"
                      >
                        <ImageFallback
                          src={imgSrc}
                          alt={`${sec.label} Frame ${imgIdx + 1}`}
                          category={project.title}
                          gifMode={isGifModeForUrl(imgSrc)}
                          className="w-full h-auto max-h-[85vh] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* GRID SECTION WITH 3-TIER RESPONSIVE RENDERING (Mobile 1-Col / Tablet 2-Col Grid / Desktop Custom) */
                <div className="w-full flex flex-col items-stretch">
                  {/* 1. MOBILE VIEW (< sm / < 640px): 1-Column vertical stack with responsive gap & 0 offsets */}
                  <div
                    style={rowsSpacingObj.num > 0 ? { rowGap: rowsSpacingObj.mobile, gap: rowsSpacingObj.mobile } : undefined}
                    className={`flex flex-col ${rowsSpacingObj.num > 0 ? "" : "gap-4"} w-full sm:hidden`}
                  >
                    {sectionRows.flatMap((r) => r.images || []).map((imgSrc, imgIdx) => {
                      const imgGlobalIdx = allImages.indexOf(imgSrc);
                      const activeGlobalIdx =
                        imgGlobalIdx !== -1 ? imgGlobalIdx : startingGlobalIndex + imgIdx;

                      return (
                        <button
                          key={imgIdx}
                          onClick={() => setLightboxIndex(activeGlobalIdx)}
                          className="overflow-hidden group cursor-pointer focus:outline-none w-full flex items-center justify-center p-0"
                        >
                          <ImageFallback
                            src={imgSrc}
                            alt={`${sec.label} Mobile Frame ${imgIdx + 1}`}
                            category={project.title}
                            gifMode={isGifModeForUrl(imgSrc)}
                            className="w-full h-auto max-h-[85vh] object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. TABLET VIEW (sm to lg / 640px to 1023px): Balanced 2-Column Responsive Grid with customWidth support and 3-image centering */}
                  <div
                    style={rowsSpacingObj.num > 0 ? { rowGap: rowsSpacingObj.tablet, gap: rowsSpacingObj.tablet } : undefined}
                    className={`hidden sm:flex sm:flex-col lg:hidden ${rowsSpacingObj.num > 0 ? "" : "gap-5"} w-full`}
                  >
                    {sectionRows.map((rowItem, rIdx) => {
                      if (!rowItem.images || rowItem.images.length === 0) return null;
                      const isSingle = rowItem.images.length === 1;
                      const cols =
                        rowItem.singleImageColumns && rowItem.singleImageColumns >= 1
                          ? rowItem.singleImageColumns
                          : 1;

                      let tabletMaxWidth = "100%";
                      if (rowItem.customWidth !== undefined && rowItem.customWidth !== null && rowItem.customWidth !== "") {
                        tabletMaxWidth = parseWidthValue(rowItem.customWidth);
                      } else if (cols > 1) {
                        tabletMaxWidth = `${Math.round(10000 / cols) / 100}%`;
                      }

                      const rowCustomColGap = rowItem.columnsGap !== undefined && rowItem.columnsGap !== null && rowItem.columnsGap !== ""
                        ? resolveResponsiveSpacing(rowItem.columnsGap).tablet
                        : "1.25rem";

                      if (isSingle) {
                        const imgSrc = rowItem.images[0];
                        const imgGlobalIdx = allImages.indexOf(imgSrc);
                        const activeGlobalIdx =
                          imgGlobalIdx !== -1 ? imgGlobalIdx : startingGlobalIndex;

                        return (
                          <div key={rIdx} className="w-full flex justify-center">
                            <div style={{ maxWidth: tabletMaxWidth, width: "100%" }} className="flex justify-center">
                              <button
                                onClick={() => setLightboxIndex(activeGlobalIdx)}
                                className="overflow-hidden group cursor-pointer focus:outline-none w-full flex items-center justify-center p-0"
                              >
                                <ImageFallback
                                  src={imgSrc}
                                  alt={`${sec.label} Tablet Single Frame ${rIdx + 1}`}
                                  category={project.title}
                                  gifMode={isGifModeForUrl(imgSrc)}
                                  className="w-full h-auto max-h-[750px] object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={rIdx} style={{ gap: rowCustomColGap }} className="grid grid-cols-2 w-full">
                          {rowItem.images.map((imgSrc, imgIdx) => {
                            const imgGlobalIdx = allImages.indexOf(imgSrc);
                            const activeGlobalIdx =
                              imgGlobalIdx !== -1 ? imgGlobalIdx : startingGlobalIndex + imgIdx;
                            const isOddLast = rowItem.images.length % 2 === 1 && imgIdx === rowItem.images.length - 1;

                            if (isOddLast) {
                              return (
                                <div key={imgIdx} className="col-span-2 flex justify-center w-full">
                                  <div className="w-1/2 flex justify-center">
                                    <button
                                      onClick={() => setLightboxIndex(activeGlobalIdx)}
                                      className="overflow-hidden group cursor-pointer focus:outline-none w-full flex items-center justify-center p-0"
                                    >
                                      <ImageFallback
                                        src={imgSrc}
                                        alt={`${sec.label} Tablet Grid Frame ${imgIdx + 1}`}
                                        category={project.title}
                                        gifMode={isGifModeForUrl(imgSrc)}
                                        className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                                      />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={imgIdx}
                                onClick={() => setLightboxIndex(activeGlobalIdx)}
                                className="overflow-hidden group cursor-pointer focus:outline-none w-full flex items-center justify-center p-0"
                              >
                                <ImageFallback
                                  src={imgSrc}
                                  alt={`${sec.label} Tablet Grid Frame ${imgIdx + 1}`}
                                  category={project.title}
                                  gifMode={isGifModeForUrl(imgSrc)}
                                  className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* 3. DESKTOP VIEW (>= lg / >= 1024px): Full Custom Control with exact user X/Y offsets, custom widths, and alignment */}
                  <div
                    style={rowsSpacingObj.num > 0 ? { rowGap: rowsSpacingObj.desktop, gap: rowsSpacingObj.desktop } : undefined}
                    className={`hidden lg:flex lg:flex-col ${rowsSpacingObj.num > 0 ? "" : "gap-6 md:gap-8"} w-full`}
                  >
                    {sectionRows.map((rowItem, rIdx) => {
                      if (!rowItem.images || rowItem.images.length === 0) return null;
                      const cols =
                        rowItem.singleImageColumns && rowItem.singleImageColumns >= 1
                          ? rowItem.singleImageColumns
                          : 1;
                      
                      // Calculate width: customWidth (numeric %, px, rem, etc.) or singleImageColumns fraction
                      let desktopMaxWidth = "100%";
                      if (rowItem.customWidth !== undefined && rowItem.customWidth !== null && rowItem.customWidth !== "") {
                        desktopMaxWidth = parseWidthValue(rowItem.customWidth);
                      } else if (cols > 1) {
                        desktopMaxWidth = `${Math.round(10000 / cols) / 100}%`;
                      }

                      const alignStyle: React.CSSProperties =
                        rowItem.rowAlignment === "left"
                          ? { marginLeft: 0, marginRight: "auto", justifyContent: "flex-start" }
                          : rowItem.rowAlignment === "right"
                          ? { marginLeft: "auto", marginRight: 0, justifyContent: "flex-end" }
                          : { marginLeft: "auto", marginRight: "auto", justifyContent: "center" };

                      const customColGap = parseSpacingValue(rowItem.columnsGap);

                      return (
                        <div
                          key={rIdx}
                          style={{
                            maxWidth: desktopMaxWidth,
                            width: "100%",
                            gap: customColGap ?? (rowItem.images.length > 1 ? "1.5rem" : undefined),
                            ...alignStyle,
                          }}
                          className="flex flex-row flex-nowrap items-start"
                        >
                          {rowItem.images.map((imgSrc, imgIdx) => {
                            const imgGlobalIdx = allImages.indexOf(imgSrc);
                            const activeGlobalIdx =
                              imgGlobalIdx !== -1 ? imgGlobalIdx : startingGlobalIndex + imgIdx;

                            const itemOffset = Array.isArray(rowItem.itemOffsets)
                              ? (rowItem.itemOffsets[imgIdx] || 0)
                              : (rowItem.itemOffsets?.[imgIdx] || 0);

                            const itemHorizontalOffset = Array.isArray(rowItem.itemHorizontalOffsets)
                              ? (rowItem.itemHorizontalOffsets[imgIdx] || 0)
                              : (rowItem.itemHorizontalOffsets?.[imgIdx] || 0);

                            const rawItemWidth = Array.isArray(rowItem.itemWidths)
                              ? rowItem.itemWidths[imgIdx]
                              : rowItem.itemWidths?.[imgIdx];

                            const parsedItemWidth = (rawItemWidth !== undefined && rawItemWidth !== null && rawItemWidth !== "" && rawItemWidth !== "100%" && rawItemWidth !== 100 && rawItemWidth !== "100")
                              ? parseWidthValue(rawItemWidth)
                              : undefined;

                            const transformStyle = (itemOffset || itemHorizontalOffset)
                              ? { transform: `translate(${itemHorizontalOffset || 0}px, ${itemOffset || 0}px)` }
                              : undefined;

                            const buttonStyle: React.CSSProperties = {
                              ...transformStyle,
                              ...(parsedItemWidth ? { width: parsedItemWidth, maxWidth: parsedItemWidth, flex: `0 0 ${parsedItemWidth}` } : {}),
                            };

                            return (
                              <button
                                key={imgIdx}
                                onClick={() => setLightboxIndex(activeGlobalIdx)}
                                style={buttonStyle}
                                className={`overflow-hidden group cursor-pointer focus:outline-none flex items-center justify-center p-0 transition-transform duration-300 ${
                                  parsedItemWidth ? "" : "w-full flex-1 min-w-0"
                                }`}
                              >
                                <ImageFallback
                                  src={imgSrc}
                                  alt={`${sec.label} Row ${rIdx + 1} Image ${imgIdx + 1}`}
                                  category={project.title}
                                  gifMode={isGifModeForUrl(imgSrc)}
                                  className="w-full h-auto max-h-[750px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════
           NEXT PROJECT NAVIGATION
      ══════════════════════════════════════════ */}
      {nextProject && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto pt-10 sm:pt-14 md:pt-20 lg:pt-[150px] pb-12 sm:pb-16 md:pb-20 lg:pb-[100px] border-t border-white/5 mt-10 sm:mt-16 md:mt-24 lg:mt-[150px] text-left">
          <div className="max-w-3xl">
            <span className="font-grotesk text-sm tracking-[0.2em] text-brand-green uppercase block mb-3">
              Next Work
            </span>
            <a
              href={`#project/${nextProject.id}`}
              className="group font-grotesk text-2xl sm:text-4xl md:text-5xl font-light tracking-wide text-white/80 hover:text-white transition-all duration-300 inline-flex items-baseline gap-3 text-left leading-tight"
            >
              <span className="group-hover:text-brand-green transition-colors duration-300">
                {nextProject.title}
              </span>
              <span className="text-brand-green group-hover:translate-x-2 transition-transform duration-300 inline-block font-sans">
                →
              </span>
            </a>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
           LIGHTBOX MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-brand-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-brand-black/80 hover:bg-brand-green/20 hover:text-brand-green text-white transition-colors cursor-pointer"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>

            {/* Prev Image */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + allImages.length) % allImages.length
                );
              }}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-brand-green transition-all cursor-pointer"
              aria-label="Previous gallery image"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Next Image */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % allImages.length);
              }}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-brand-green transition-all cursor-pointer"
              aria-label="Next gallery image"
            >
              <ArrowRight size={24} />
            </button>

            {/* Lightbox Inner container */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-5xl w-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <ImageFallback
                  src={allImages[lightboxIndex]}
                  alt="Gallery enlargement"
                  category="general"
                  gifMode={isGifModeForUrl(allImages[lightboxIndex])}
                  className="w-full aspect-[16/10] object-contain max-h-[75vh]"
                />
              </div>

              {/* Status Info */}
              <div className="text-white/60 font-sans text-xs tracking-wider uppercase">
                IMAGE {lightboxIndex + 1} OF {allImages.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
