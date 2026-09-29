/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Poster images can be up to 5 MB, plus room for the other form fields
      // and multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
