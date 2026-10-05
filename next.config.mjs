/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Netlify only exposes these at build time, so inline them for the server
  // to tell deploy previews apart from production (see src/lib/auth.ts).
  env: {
    NETLIFY_CONTEXT: process.env.CONTEXT ?? "",
    NETLIFY_DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL ?? "",
  },
  experimental: {
    serverActions: {
      // Poster images can be up to 5 MB, plus room for the other form fields
      // and multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
