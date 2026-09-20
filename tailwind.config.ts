import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fmcg: {
          green: '#059669',
          darkgreen: '#064e3b',
          blue: '#2563eb',
          amber: '#d97706',
          slate: '#0f172a',
        }
      },
    },
  },
  plugins: [],
};
export default config;
