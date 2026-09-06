import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function copyAssetsPlugin() {
  return {
    name: 'copy-src-assets',
    closeBundle() {
      const srcAssets = path.resolve(__dirname, 'src/assets');
      const distSrcAssets = path.resolve(__dirname, 'dist/src/assets');
      const distAssets = path.resolve(__dirname, 'dist/assets');
      if (fs.existsSync(srcAssets)) {
        fs.mkdirSync(path.dirname(distSrcAssets), { recursive: true });
        fs.cpSync(srcAssets, distSrcAssets, { recursive: true });
        fs.cpSync(srcAssets, distAssets, { recursive: true });
      }

      // Copy uploads directory to dist/uploads so uploaded share images are accessible statically
      const uploadsDir = path.resolve(__dirname, 'uploads');
      const distUploads = path.resolve(__dirname, 'dist/uploads');
      if (fs.existsSync(uploadsDir)) {
        fs.mkdirSync(distUploads, { recursive: true });
        fs.cpSync(uploadsDir, distUploads, { recursive: true });
      }
    },
  };
}

function dynamicMetaTagsPlugin() {
  return {
    name: 'dynamic-meta-tags',
    transformIndexHtml(html: string) {
      let dbData: any = null;

      // 1. Prefer src/defaultData.ts (the file downloaded from the CMS Dashboard and committed to GitHub)
      const defaultDataFile = path.resolve(__dirname, 'src/defaultData.ts');
      if (fs.existsSync(defaultDataFile)) {
        try {
          const rawTs = fs.readFileSync(defaultDataFile, 'utf-8');
          const jsonMatch = rawTs.match(/export const defaultSiteData(?:\s*:\s*CMSSiteData)?\s*=\s*(\{[\s\S]*\});?\s*$/);
          if (jsonMatch && jsonMatch[1]) {
            dbData = JSON.parse(jsonMatch[1]);
          }
        } catch (e) {
          console.warn('Vite: Failed to parse src/defaultData.ts during HTML transform', e);
        }
      }

      // 2. Fallback to data.json if defaultData.ts was not present or could not be parsed
      if (!dbData) {
        const dataFile = path.resolve(__dirname, 'data.json');
        if (fs.existsSync(dataFile)) {
          try {
            dbData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
          } catch (e) {
            console.warn('Vite: Failed to read data.json during HTML transform', e);
          }
        }
      }

      const lp = dbData?.linkPreview || {};
      const siteUrl = (lp.siteUrl || 'https://www.youssefabaali.com').replace(/\/+$/, '');
      const title = lp.shareTitle || dbData?.name || 'Youssef Abaali — Motion Graphics Designer';
      const desc = lp.shareDescription || "I'm here to help you turn your ideas into life.";
      
      const rawImg = lp.shareImage || '/assets/images/link-share-preview.jpg';
      let shareImg = String(rawImg).trim();
      if (!/^https?:\/\//i.test(shareImg) && !shareImg.startsWith('data:')) {
        let cleanPath = shareImg.startsWith('/') ? shareImg : `/${shareImg}`;
        if (cleanPath.startsWith('/src/')) {
          cleanPath = cleanPath.replace(/^\/src\//, '/');
        }
        shareImg = `${siteUrl}${cleanPath}`;
      }

      let rawFavicon = String(lp.siteFavicon || '/favicon.svg').trim();
      let cleanFavicon = rawFavicon;
      if (cleanFavicon.startsWith('/src/')) {
        cleanFavicon = cleanFavicon.replace(/^\/src\//, '/');
      } else if (cleanFavicon.startsWith('src/')) {
        cleanFavicon = cleanFavicon.replace(/^src\//, '/');
      }
      if (!cleanFavicon.startsWith('/') && !/^https?:\/\//i.test(cleanFavicon) && !cleanFavicon.startsWith('data:')) {
        cleanFavicon = `/${cleanFavicon}`;
      }
      const faviconUrl = cleanFavicon;
      const faviconType = faviconUrl.endsWith('.ico')
        ? 'image/x-icon'
        : faviconUrl.endsWith('.png')
        ? 'image/png'
        : faviconUrl.endsWith('.webp')
        ? 'image/webp'
        : faviconUrl.endsWith('.jpg') || faviconUrl.endsWith('.jpeg')
        ? 'image/jpeg'
        : 'image/svg+xml';

      const escape = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      let transformed = html;

      // Title & Descriptions
      transformed = transformed.replace(/<title>.*?<\/title>/is, `<title>${escape(title)}</title>`);
      transformed = transformed.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escape(desc)}" />`);

      // OpenGraph & Twitter Titles
      transformed = transformed.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escape(title)}" />`);
      transformed = transformed.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escape(title)}" />`);

      // OpenGraph & Twitter Descriptions
      transformed = transformed.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escape(desc)}" />`);
      transformed = transformed.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escape(desc)}" />`);

      // OpenGraph & Twitter Absolute Images
      transformed = transformed.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escape(shareImg)}" />`);
      transformed = transformed.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escape(shareImg)}" />`);

      // OpenGraph URL & Canonical
      transformed = transformed.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${siteUrl}/" />`);
      transformed = transformed.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${siteUrl}/" />`);

      // Favicons & Apple Touch Icon
      transformed = transformed.replace(/<link\s+rel="icon".*?>/i, `<link rel="icon" type="${faviconType}" href="${escape(faviconUrl)}" />`);
      transformed = transformed.replace(/<link\s+rel="apple-touch-icon".*?>/i, `<link rel="apple-touch-icon" href="${escape(faviconUrl)}" />`);

      return transformed;
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), dynamicMetaTagsPlugin(), copyAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
