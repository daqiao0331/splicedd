const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        // 2019-Splice navigation rail / chrome.
        splice: {
          rail: "#0f1115",
          panel: "#1b1e25",
          accent: "#1ecbb0"
        }
      }
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        // The 2019 Splice desktop app is dark by default; this mirrors its palette.
        dark: {
          colors: {
            background: "#15171c",
            foreground: "#e7e9ee",
            content1: "#1b1e25",
            content2: "#23272f",
            content3: "#2c313a",
            divider: "rgba(255, 255, 255, 0.08)",
            focus: "#1ecbb0",
            primary: {
              DEFAULT: "#1ecbb0",
              foreground: "#04211c"
            }
          }
        }
      }
    })
  ]
}
