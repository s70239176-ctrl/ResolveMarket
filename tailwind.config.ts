import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141516",
        paper: "#f8f7f3",
        line: "#d8d4ca",
        mint: "#58b884",
        coral: "#ee735f",
        steel: "#42667a"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(20, 21, 22, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
