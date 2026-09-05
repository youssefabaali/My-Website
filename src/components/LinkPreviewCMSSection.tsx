import { useState, useRef, useEffect } from "react";
import { CMSSiteData, LinkPreviewSettings } from "../types/cms";
import { toAbsoluteUrl, DEFAULT_SITE_URL } from "../utils/urlHelper";
import {
  Share2,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Info,
  Globe,
  Monitor,
  MessageSquare,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";

interface LinkPreviewCMSSectionProps {
  data: CMSSiteData;
  updateData: (
    updater: (prev: CMSSiteData) => CMSSiteData,
    action?: string,
    details?: string
  ) => Promise<boolean>;
  uploadFile: (file: File) => Promise<string>;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
}

export function LinkPreviewCMSSection({
  data,
  updateData,
  uploadFile,
  showNotification,
}: LinkPreviewCMSSectionProps) {
  const currentLP: Partial<LinkPreviewSettings> = data.linkPreview || {};
  const [form, setForm] = useState<LinkPreviewSettings>({
    shareImage: currentLP.shareImage || "https://www.youssefabaali.com/assets/images/project-1.png",
    shareTitle: currentLP.shareTitle || data.name || "Youssef Abaali — Motion Graphics Designer",
    shareDescription: currentLP.shareDescription || "I'm here to help you turn your ideas into life.",
    siteFavicon: currentLP.siteFavicon || "/favicon.svg",
    siteUrl: currentLP.siteUrl || DEFAULT_SITE_URL,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [previewTab, setPreviewTab] = useState<"linkedin" | "whatsapp" | "browser">("linkedin");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Measure image dimensions whenever shareImage changes
  useEffect(() => {
    if (!form.shareImage) {
      setImageDimensions(null);
      return;
    }
    const img = new Image();
    img.src = form.shareImage;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
  }, [form.shareImage]);

  // Handle Share Image upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file (.png, .jpg, .webp, .svg)", "error");
      return;
    }

    try {
      setUploadingImage(true);
      const relativeUrl = await uploadFile(file);
      // Automatically convert to absolute URL
      const absoluteUrl = toAbsoluteUrl(relativeUrl, form.siteUrl);
      setForm((prev) => ({ ...prev, shareImage: absoluteUrl }));
      showNotification("Share image uploaded and converted to absolute URL successfully!");
    } catch (err: any) {
      showNotification(`Upload failed: ${err.message || "Unknown error"}`, "error");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle Favicon upload (accepts .ico, .png, .svg)
  const handleFaviconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".ico", ".png", ".svg", ".webp"];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt && !file.type.includes("icon") && !file.type.includes("image")) {
      showNotification("Favicon must be a .ico, .png, or .svg file", "error");
      return;
    }

    try {
      setUploadingFavicon(true);
      const uploadedUrl = await uploadFile(file);
      setForm((prev) => ({ ...prev, siteFavicon: uploadedUrl }));
      showNotification("Favicon uploaded successfully!");
    } catch (err: any) {
      showNotification(`Favicon upload failed: ${err.message || "Unknown error"}`, "error");
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  // Save changes to database
  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure shareImage is absolute before persisting
      const normalizedShareImage = toAbsoluteUrl(form.shareImage, form.siteUrl);
      const updatedLP: LinkPreviewSettings = {
        ...form,
        shareImage: normalizedShareImage,
        shareTitle: form.shareTitle.trim() || data.name || "Youssef Abaali — Motion Graphics Designer",
        shareDescription: form.shareDescription.trim() || "I'm here to help you turn your ideas into life.",
        siteFavicon: form.siteFavicon.trim() || "/favicon.svg",
        siteUrl: form.siteUrl.trim() || DEFAULT_SITE_URL,
      };

      setForm(updatedLP);

      const success = await updateData(
        (prev) => ({
          ...prev,
          linkPreview: updatedLP,
        }),
        "Update Link Preview Settings",
        `Configured Share Image, Title, Description (${updatedLP.shareDescription.length} chars) & Favicon`
      );

      if (success) {
        showNotification("Link Preview & Social Sharing settings saved successfully!");
      } else {
        showNotification("Failed to save settings. Please check passcode.", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setForm({
      shareImage: "https://www.youssefabaali.com/assets/images/project-1.png",
      shareTitle: "Youssef Abaali — Motion Graphics Designer",
      shareDescription: "I'm here to help you turn your ideas into life.",
      siteFavicon: "/favicon.svg",
      siteUrl: DEFAULT_SITE_URL,
    });
    showNotification("Reset fields to system defaults. Click 'Save Changes' to apply.", "info");
  };

  const descLength = form.shareDescription.length;
  const isDescOverLimit = descLength > 160;

  const isExactRatio =
    imageDimensions &&
    Math.abs(imageDimensions.width / imageDimensions.height - 1200 / 630) < 0.08;

  return (
    <div className="flex flex-col gap-8 text-left pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-850 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
            <Share2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bebas text-3xl tracking-widest text-white">LINK PREVIEW SETTINGS</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-green/20 text-brand-green rounded border border-brand-green/30">
                SEO & OpenGraph
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Customize how your portfolio appears when shared on LinkedIn, WhatsApp, Facebook, and Twitter/X.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            title="Reset fields to recommended defaults"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all shadow-lg hover:shadow-brand-green/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Mock Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* FIELD 1: Share Image */}
          <div className="p-6 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ImageIcon size={16} className="text-brand-green" />
                Share Image (og:image & twitter:image)
              </label>
              {imageDimensions && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    isExactRatio
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {imageDimensions.width} × {imageDimensions.height} px
                  {isExactRatio ? " (Optimal 1.91:1)" : ""}
                </span>
              )}
            </div>

            {/* Guidance Tooltip Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-green/5 border border-brand-green/20 text-neutral-300 text-xs leading-relaxed">
              <Info size={16} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Recommended Dimensions: 1200 × 630 px</strong> (Aspect Ratio 1.91:1).
                This ensures your image displays full-bleed without cropping, black bars, or blur on LinkedIn, WhatsApp, and Facebook.
              </div>
            </div>

            {/* Image Preview & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-48 h-28 bg-neutral-950 rounded-xl overflow-hidden border border-white/10 shrink-0 flex items-center justify-center group">
                {form.shareImage ? (
                  <img
                    src={form.shareImage}
                    alt="Share preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-neutral-600 flex flex-col items-center gap-1 text-[11px]">
                    <ImageIcon size={20} />
                    <span>No image</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2 w-full">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploadingImage ? "Uploading..." : "Upload New Image"}
                  </button>
                  {form.shareImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          shareImage: "https://www.youssefabaali.com/assets/images/project-1.png",
                        }))
                      }
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Reset to default image"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500">
                  Uploaded files automatically get a full absolute URL (<code className="text-brand-green/80">https://www.youssefabaali.com/...</code>).
                </p>
              </div>
            </div>

            {/* Direct URL Input */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Image URL (Absolute Path)
              </label>
              <input
                type="text"
                value={form.shareImage}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({ ...prev, shareImage: val }));
                }}
                onBlur={() => {
                  // Ensure on blur that it's absolute
                  if (form.shareImage) {
                    setForm((prev) => ({
                      ...prev,
                      shareImage: toAbsoluteUrl(form.shareImage, form.siteUrl),
                    }));
                  }
                }}
                placeholder="https://www.youssefabaali.com/assets/images/project-1.png"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs font-mono focus:border-brand-green/50 focus:outline-none"
              />
            </div>
          </div>

          {/* FIELD 2: Share Title */}
          <div className="p-6 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white">
                Share Title (og:title & twitter:title)
              </label>
              <span className="text-[11px] text-neutral-500">Recommended: 40–70 characters</span>
            </div>
            <input
              type="text"
              value={form.shareTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, shareTitle: e.target.value }))}
              placeholder="Youssef Abaali — Motion Graphics Designer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-sm focus:border-brand-green/50 focus:outline-none"
            />
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              This headline appears in bold on LinkedIn, WhatsApp cards, Facebook posts, and Twitter/X previews.
            </p>
          </div>

          {/* FIELD 3: Share Description */}
          <div className="p-6 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white">
                Share Description (og:description & twitter:description)
              </label>
              {/* Character Counter */}
              <div
                className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${
                  isDescOverLimit
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold"
                    : "bg-white/5 text-neutral-300 border-white/10"
                }`}
              >
                {descLength} / 160 chars
              </div>
            </div>

            <textarea
              rows={3}
              value={form.shareDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, shareDescription: e.target.value }))}
              placeholder="I'm here to help you turn your ideas into life."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border text-white text-sm focus:outline-none transition-colors ${
                isDescOverLimit ? "border-amber-500/50 focus:border-amber-400" : "border-white/10 focus:border-brand-green/50"
              }`}
            />

            {/* Character Length Warning if > 160 */}
            {isDescOverLimit ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                <span>
                  Description exceeds 160 characters. WhatsApp, LinkedIn mobile, and search engines may truncate this with an ellipsis (...).
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Aim for 100–160 characters for a clean, compelling summary that won't be truncated.
              </p>
            )}
          </div>

          {/* FIELD 4: Site Favicon */}
          <div className="p-6 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Globe size={16} className="text-brand-green" />
                Site Favicon & Apple Touch Icon
              </label>
              <span className="text-[11px] text-neutral-500">Supports .ico, .png, .svg</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Favicon Square Preview */}
              <div className="w-14 h-14 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-center p-2 shrink-0">
                {form.siteFavicon ? (
                  <img
                    src={form.siteFavicon}
                    alt="Favicon preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Globe size={20} className="text-neutral-600" />
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="file"
                  ref={faviconInputRef}
                  onChange={handleFaviconFileChange}
                  accept=".ico,.png,.svg,.webp,image/x-icon,image/png,image/svg+xml"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingFavicon ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    {uploadingFavicon ? "Uploading..." : "Upload New Favicon (.ico / .png / .svg)"}
                  </button>
                  {form.siteFavicon !== "/favicon.svg" && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, siteFavicon: "/favicon.svg" }))}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Reset to default SVG"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Updates <code className="text-neutral-300">&lt;link rel="icon"&gt;</code> and <code className="text-neutral-300">&lt;link rel="apple-touch-icon"&gt;</code> immediately in the browser tab.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mock Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="p-6 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-green" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  LIVE SOCIAL PREVIEW
                </h2>
              </div>

              {/* Preview Platform Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-950 border border-white/5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("linkedin")}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    previewTab === "linkedin"
                      ? "bg-brand-green text-neutral-950 shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("whatsapp")}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    previewTab === "whatsapp"
                      ? "bg-brand-green text-neutral-950 shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("browser")}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    previewTab === "browser"
                      ? "bg-brand-green text-neutral-950 shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Tab
                </button>
              </div>
            </div>

            {/* TAB 1: LinkedIn / Facebook Card */}
            {previewTab === "linkedin" && (
              <div className="flex flex-col rounded-xl overflow-hidden border border-neutral-800 bg-[#1b1f23] text-neutral-200">
                {/* Simulated LinkedIn post header */}
                <div className="p-3 bg-[#1e2329] border-b border-neutral-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-xs text-white">
                    YA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">Youssef Abaali</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Motion Graphics Designer • Now</div>
                  </div>
                </div>

                {/* Card Image Banner */}
                <div className="relative aspect-[1200/630] w-full bg-neutral-950 overflow-hidden">
                  {form.shareImage ? (
                    <img
                      src={form.shareImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                      No Image Set
                    </div>
                  )}
                </div>

                {/* Card Content Footer */}
                <div className="p-3.5 flex flex-col gap-1 bg-[#191d22]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                    youssefabaali.com
                  </span>
                  <div className="text-sm font-bold text-white line-clamp-2 leading-snug">
                    {form.shareTitle || "Youssef Abaali — Motion Graphics Designer"}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {form.shareDescription || "I'm here to help you turn your ideas into life."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: WhatsApp Chat Bubble Card */}
            {previewTab === "whatsapp" && (
              <div className="p-4 rounded-xl bg-[#0b141a] flex flex-col gap-3">
                <div className="max-w-sm rounded-xl overflow-hidden bg-[#1f2c34] border border-[#2a3942] text-neutral-200 shadow-md">
                  {/* Image */}
                  <div className="aspect-[1200/630] w-full bg-neutral-950 overflow-hidden">
                    {form.shareImage ? (
                      <img
                        src={form.shareImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                        No Image Set
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3 flex flex-col gap-1 border-t border-[#2a3942]">
                    <div className="text-xs font-bold text-[#e9edef] line-clamp-1">
                      {form.shareTitle || "Youssef Abaali — Motion Graphics Designer"}
                    </div>
                    <p className="text-[11px] text-[#8696a0] line-clamp-2 leading-relaxed">
                      {form.shareDescription || "I'm here to help you turn your ideas into life."}
                    </p>
                    <span className="text-[10px] text-[#00a884] font-medium pt-1">
                      youssefabaali.com
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-neutral-500 text-center">
                  Preview in WhatsApp dark mode chat
                </span>
              </div>
            )}

            {/* TAB 3: Browser Tab Mockup */}
            {previewTab === "browser" && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-950">
                  {/* Browser top chrome */}
                  <div className="px-3 pt-2.5 pb-1 bg-neutral-900 border-b border-white/10 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>

                    {/* Active Browser Tab */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-neutral-950 border-t border-x border-white/10 max-w-xs">
                      {form.siteFavicon ? (
                        <img
                          src={form.siteFavicon}
                          alt="Favicon"
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                      ) : (
                        <Globe size={14} className="text-brand-green shrink-0" />
                      )}
                      <span className="text-xs text-white truncate font-medium">
                        {form.shareTitle || "Youssef Abaali"}
                      </span>
                    </div>
                  </div>

                  {/* Browser Address Bar */}
                  <div className="px-3 py-2 bg-neutral-950 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="text-brand-green">🔒</span>
                    <span>https://www.youssefabaali.com/</span>
                  </div>
                </div>

                <span className="text-[10px] text-neutral-500 text-center">
                  Shows the favicon and title in your browser's tab header
                </span>
              </div>
            )}

            {/* Diagnostic Checklist */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 mt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Live OpenGraph Diagnostics
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Image URL Type:</span>
                <span className="font-mono text-green-400 font-semibold text-[11px]">
                  {form.shareImage.startsWith("http") ? "Absolute (Valid)" : "Relative"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">og:url Status:</span>
                <span className="font-mono text-green-400 font-semibold text-[11px]">
                  https://www.youssefabaali.com/
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">og:image:width / height:</span>
                <span className="font-mono text-green-400 font-semibold text-[11px]">
                  1200 × 630 px
                </span>
              </div>
            </div>

            {/* Platform Official Debugger Links */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Platform Cache Clear / Debuggers:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://www.linkedin.com/post-inspector/inspect/https:%2F%2Fwww.youssefabaali.com%2F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
                >
                  <ExternalLink size={12} />
                  LinkedIn Inspector
                </a>
                <a
                  href="https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fwww.youssefabaali.com%2F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
                >
                  <ExternalLink size={12} />
                  Facebook Debugger
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
