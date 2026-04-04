/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * V dev: bez cache na HTML routách — méně „starého“ dokumentu s odkazy na neexistující chunky
   * po restartu serveru / přepnutí projektu.
   */
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
    ];
    if (process.env.NODE_ENV === "development") {
      const noCache = [
        {
          key: "Cache-Control",
          value: "no-store, max-age=0, must-revalidate",
        },
      ];
      return [
        ...["/", "/studio", "/report", "/report/print"].map((source) => ({
          source,
          headers: noCache,
        })),
        { source: "/:path*", headers: security },
      ];
    }
    return [{ source: "/:path*", headers: security }];
  },
  /** Výchozí požadavek prohlížeče na /favicon.ico → stejná grafika jako SVG (bez 404). */
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
        permanent: false,
      },
    ];
  },
  /** ESLint může dědit pravidla z nadřazené složky bez pluginů — build neblokovat. */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * Zajistí jednotné projití webpackem (CJS/ESM interop) — prevence runtime chyb
   * typu __webpack_require__.n u zustand/middleware a tailwind-merge v dev.
   */
  transpilePackages: ["zustand", "tailwind-merge"],
};

export default nextConfig;
