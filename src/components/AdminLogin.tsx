import { useState, useEffect } from "react";
import { useCMS } from "../context/CMSContext";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { motion } from "motion/react";

interface AdminLoginProps {
  onBackToSite?: () => void;
}

const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

export function AdminLogin({ onBackToSite }: AdminLoginProps) {
  const { login } = useCMS();
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting & Cooldown Lockout State
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("cms_failed_attempts");
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("cms_lockout_until");
      if (stored) {
        const time = parseInt(stored, 10);
        if (time > Date.now()) return time;
      }
    } catch {}
    return null;
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Countdown timer for lockout duration
  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        try {
          localStorage.removeItem("cms_lockout_until");
          localStorage.setItem("cms_failed_attempts", "0");
        } catch {}
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLocked = Boolean(lockoutUntil && remainingSeconds > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !passcode.trim()) return;

    setIsLoading(true);
    setIsError(false);

    // Artificial small delay for security & smooth feel
    await new Promise((resolve) => setTimeout(resolve, 400));

    const success = await login(passcode);
    setIsLoading(false);

    if (success) {
      // Reset attempts on successful login
      setFailedAttempts(0);
      setLockoutUntil(null);
      try {
        localStorage.removeItem("cms_failed_attempts");
        localStorage.removeItem("cms_lockout_until");
      } catch {}
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsError(true);
      setPasscode("");

      try {
        localStorage.setItem("cms_failed_attempts", newAttempts.toString());
      } catch {}

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockTime);
        try {
          localStorage.setItem("cms_lockout_until", lockTime.toString());
        } catch {}
      }
    }
  };

  const adminStyleVars = {
    "--brand-green": "#8cff2e",
    "--brand-black": "#131313",
    "--brand-white": "#ffffff",
    "--brand-card": "#1a1a1a",
    "--brand-footer": "#c8c5ae",
    "--brand-accent": "#8cff2e",
    "--brand-border": "#262626",
    "--brand-button-bg": "#8cff2e",
    "--brand-button-text": "#131313",
    "--brand-muted": "#a3a3a3",
    "--brand-nav-bg": "#131313",
    "--brand-nav-text": "#ffffff",
    "--brand-badge-bg": "#262626",
    "--brand-badge-text": "#8cff2e",
  } as React.CSSProperties;

  const handleReturn = () => {
    if (onBackToSite) {
      onBackToSite();
    } else {
      window.location.hash = "";
      window.location.reload();
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failedAttempts);

  return (
    <div
      style={adminStyleVars}
      className="fixed inset-0 bg-[#0a0a0a] z-[9999] flex flex-col items-center justify-center p-6 text-white font-grotesk overflow-hidden selection:bg-brand-green selection:text-brand-black"
    >
      {/* Ambient background glow grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#151515_1px,transparent_1px),linear-gradient(to_bottom,#151515_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Login container */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[420px] bg-neutral-900/95 border border-white/10 rounded-2xl p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        {/* Glow corner line */}
        <div className="absolute -top-[1px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-brand-green/40 to-transparent" />

        {/* Head branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-white/5 flex items-center justify-center mb-4 text-brand-green shadow-inner">
            <ShieldCheck size={24} className="animate-pulse" />
          </div>
          <h1 className="font-bebas text-3xl tracking-widest text-white">
            PORTFOLIO CMS
          </h1>
          <p className="text-xs text-neutral-400 tracking-wider uppercase mt-1">
            Youssef Abaali • Secure Workspace
          </p>
        </div>

        {/* Lockout Warning Banner if Locked */}
        {isLocked ? (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-col items-center text-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-1">
              <Clock size={18} />
            </div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Access Temporarily Locked
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Too many incorrect passcode attempts ({MAX_ATTEMPTS}/{MAX_ATTEMPTS}). For security, entry is locked for:
            </p>
            <span className="text-lg font-mono font-bold text-brand-green bg-black/60 px-3 py-1 rounded-lg border border-white/10 mt-1">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">
                Enter Admin Passcode
              </label>
              <div
                className={`relative flex items-center rounded-xl bg-neutral-950 border transition-all duration-300 ${
                  isError
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-shake"
                    : "border-white/10 focus-within:border-brand-green focus-within:shadow-[0_0_15px_rgba(140,255,46,0.1)]"
                }`}
              >
                <div className="pl-4 text-neutral-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (isError) setIsError(false);
                  }}
                  placeholder="••••••••"
                  disabled={isLoading || isLocked}
                  autoFocus
                  className="w-full bg-transparent px-3 py-3.5 text-sm font-mono tracking-widest text-white placeholder-neutral-700 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-neutral-500 hover:text-brand-green transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Error and Remaining Attempts indicator */}
              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between text-xs mt-1"
                >
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle size={13} className="shrink-0" />
                    Incorrect passcode.
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
                  </span>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passcode || isLocked}
              className="w-full bg-brand-green text-brand-black font-semibold text-xs tracking-widest uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all duration-300 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  AUTHENTICATE
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info & Exit */}
        <div className="text-center mt-6 pt-5 border-t border-white/5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleReturn}
            className="text-[11px] text-neutral-400 hover:text-brand-green transition-colors flex items-center gap-1.5 cursor-pointer mt-1"
          >
            ← Return to Portfolio Website
          </button>
        </div>
      </motion.div>
    </div>
  );
}
