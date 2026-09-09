import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101010",
        paper: "#f2f0e9",
        surface: "#faf9f5",
        line: "#181818",
        muted: "#55524d",
        faint: "#8b8881",
        red: "#e32219",
        redsoft: "#f4d9d5"
      },
      boxShadow: {}
    }
  },
  plugins: []
};

export default config;
