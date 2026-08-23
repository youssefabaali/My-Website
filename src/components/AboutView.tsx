import { useState } from "react";
import { useCMS } from "../context/CMSContext";
import { motion } from "motion/react";
import { ImageFallback, fixAssetUrl } from "./ImageFallback";
import { FileText, Download, Copy, Check, ExternalLink, ArrowUpRight } from "lucide-react";

export function AboutView() {
  const { data } = useCMS();
  const [copied, setCopied] = useState(false);

  const design = data.design || { layout: { sectionGap: 250, sectionGapMobile: 100, paddingTop: 128, paddingBottom: 96, paragraphGap: 24, headingGap: 24 } };
  const gapDesktop = design.layout.sectionGap ?? 250;
  const gapTablet = design.layout.sectionGap ?? 250;
  const gapMobile = design.layout.sectionGapMobile ?? design.layout.sectionGap ?? 250;

  const pyTopDesktop = design.layout.paddingTop ?? 128;
  const pyBottomDesktop = design.layout.paddingBottom ?? pyTopDesktop;
  const pyTopTablet = Math.min(Math.max(48, Math.round(pyTopDesktop * 0.75)), 96);
  const pyBottomTablet = Math.min(Math.max(40, Math.round(pyBottomDesktop * 0.75)), 80);
  const pyTopMobile = Math.min(Math.max(32, Math.round(pyTopDesktop * 0.5)), 64);
  const pyBottomMobile = Math.min(Math.max(28, Math.round(pyBottomDesktop * 0.5)), 56);
  const paragraphGap = design.layout.paragraphGap ?? 24;
  const headingGap = design.layout.headingGap ?? 24;

  const aboutMe = data.aboutMe || {
    profileImage: "/src/assets/images/MyPicture.jpg",
    paragraphs: [],
    creativeHeadline: "My creative\ntoolbox",
    skills: [],
    resumeUrl: "/assets/Resume-Youssef-Abaali.pdf",
    resumeButtonText: "My Resume"
  };

  const currentEmail = data.contact?.email || data.email;

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(currentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  const socialContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const socialCardVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.45,
        ease: "easeOut" as const,
      },
    },
  };

  const desktopWidth = aboutMe.profileImageWidthDesktop || 440;
  const mobileWidth = aboutMe.profileImageWidthMobile || 380;
  const bioEmailGapDesktop = aboutMe.bioEmailGapDesktop ?? 64;
  const bioEmailGapMobile = aboutMe.bioEmailGapMobile ?? 32;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full cms-page-padding"
    >
      <style>{`
        .cms-page-padding {
          padding-top: ${pyTopMobile}px;
          padding-bottom: ${pyBottomMobile}px;
        }
        @media (min-width: 768px) {
          .cms-page-padding {
            padding-top: ${pyTopTablet}px;
            padding-bottom: ${pyBottomTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .cms-page-padding {
            padding-top: ${pyTopDesktop}px;
            padding-bottom: ${pyBottomDesktop}px;
          }
        }

        .cms-bio-email-gap {
          margin-bottom: ${bioEmailGapMobile}px;
        }
        @media (min-width: 1024px) {
          .cms-bio-email-gap {
            margin-bottom: ${bioEmailGapDesktop}px;
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

        @media (min-width: 1024px) {
          .about-bio-grid {
            grid-template-columns: ${desktopWidth}px 1fr !important;
          }
        }
      `}</style>
      {/* ══════════════════════════════════════════
           PROFILE BIOGRAPHY SECTION
       ══════════════════════════════════════════ */}
      <section className="w-full cms-bio-email-gap">
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 about-bio-grid gap-12 md:gap-16 lg:gap-20 items-start">
            {/* Picture wrap - Centered on Mobile/Tablet (< lg), Left-aligned on Desktop (>= lg) */}
            <motion.div
              variants={itemVariants}
              className="w-full mx-auto lg:mx-0 flex justify-center lg:block"
              style={{ maxWidth: `min(100%, ${mobileWidth}px)` }}
            >
              <div className="aspect-[3/3.8] overflow-hidden bg-brand-card shadow-2xl w-full max-w-[380px] sm:max-w-[420px] md:max-w-[460px] lg:max-w-none mx-auto">
                <ImageFallback
                  src={aboutMe.profileImage}
                  alt="Youssef Abaali Profile Photo"
                  fallbackType="profile"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Description biography */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col text-left pt-2 max-w-4xl mx-auto lg:mx-0 w-full"
              style={{ gap: `${paragraphGap}px` }}
            >
              {aboutMe.paragraphs.map((para, index) => {
                const isSemiBold = index === aboutMe.paragraphs.length - 2;
                return (
                  <p
                    key={index}
                    className={`font-grotesk text-[15px] sm:text-base leading-relaxed tracking-wide ${
                      isSemiBold
                        ? "text-white/90 font-semibold mt-4"
                        : "text-white"
                    }`}
                  >
                    {para}
                  </p>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           EMAIL + SOCIAL SECTION
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/5 py-12 bg-brand-black w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16 flex flex-col items-center gap-10"
        >
          {/* Call-to-action email with copy button */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4"
          >
            <a
              href={`mailto:${currentEmail}`}
              className="font-grotesk text-base sm:text-xl md:text-2xl font-medium tracking-wide sm:tracking-widest text-brand-green hover:opacity-85 transition-opacity text-center break-words select-all cursor-text"
            >
              {currentEmail}
            </a>

            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-brand-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Copy Email Address to Clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400 font-bold" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </motion.div>

          {/* MY RESUME PDF BUTTON */}
          {aboutMe.resumeUrl && (
            <motion.div variants={itemVariants} className="flex items-center justify-center my-2">
              <a
                href={aboutMe.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-brand-green text-brand-black hover:bg-white px-7 py-3.5 font-grotesk font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-lg"
              >
                <FileText size={18} className="text-brand-black group-hover:text-black" />
                <span>{aboutMe.resumeButtonText || "My Resume"}</span>
                <ExternalLink size={15} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </motion.div>
          )}

          {/* Social connections — Interactive Bento / Platform Cards */}
          {((data.aboutSocials || data.socials) && (data.aboutSocials || data.socials).length > 0) && (
            <motion.div
              variants={socialContainerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full max-w-6xl mx-auto mt-4 px-2"
            >
              <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-sm sm:max-w-none mx-auto">
                {(data.aboutSocials || data.socials).map((social) => (
                  <motion.a
                    key={social.name}
                    variants={socialCardVariants}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-neutral-900/60 hover:bg-neutral-900/95 border border-white/10 hover:border-brand-green/50 px-4 py-3 sm:px-3.5 sm:py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all duration-300 hover:shadow-[0_6px_25px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer w-full sm:w-auto shrink-0"
                    aria-label={social.name}
                  >
                    {/* Subtle Ambient Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green/0 via-brand-green/[0.02] to-brand-green/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Left: Icon + Platform Name */}
                    <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-950/90 border border-white/10 group-hover:border-brand-green/40 flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-105 shrink-0 shadow-inner">
                        <img
                          src={fixAssetUrl(social.icon || social.iconBW)}
                          alt={social.name}
                          className="w-full h-full object-contain select-none pointer-events-none filter transition-all duration-300 group-hover:brightness-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-bebas text-base sm:text-lg tracking-wider text-neutral-200 group-hover:text-brand-green uppercase transition-colors duration-300 whitespace-nowrap">
                        {social.name}
                      </span>
                    </div>

                    {/* Right: Interactive Arrow Button */}
                    <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-white/[0.04] group-hover:bg-brand-green border border-white/10 group-hover:border-brand-green flex items-center justify-center text-white/50 group-hover:text-brand-black transition-all duration-300 shrink-0 relative z-10">
                      <ArrowUpRight
                        size={13}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
           MY CREATIVE TOOLBOX
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/5 py-20 bg-brand-black/40 w-full">
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-12 xl:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Headline */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-120px" }}
            className="text-left"
          >
            <h2 className="font-grotesk text-[32px] sm:text-[40px] md:text-[48px] font-normal leading-[1.15] tracking-tight text-white uppercase whitespace-pre-line">
              {aboutMe.creativeHeadline}
            </h2>
          </motion.div>

          {/* Skill lines */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-120px" }}
            className="flex flex-col gap-8 text-left"
          >
            {aboutMe.skills.map((skill) => (
              <motion.div key={skill.name} variants={itemVariants} className="flex flex-col gap-2.5">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="font-grotesk text-sm font-semibold tracking-wider text-white">
                      {skill.name}
                    </span>
                    <span className="font-grotesk text-xs text-white/45 tracking-wide mt-0.5">
                      {skill.desc}
                    </span>
                  </div>
                  <span className="font-grotesk text-xs sm:text-sm font-bold tracking-wider text-brand-green">
                    {skill.percent}%
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-green rounded-full"
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${skill.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
