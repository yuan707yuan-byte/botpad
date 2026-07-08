/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bot: {
          bg:     "#06060f",
          card:   "#0d0d1f",
          border: "#1a1a3a",
          green:  "#00ffb2",
          dim:    "#00c88a",
          purple: "#7b61ff",
          red:    "#ff4d6d"
        }
      },
      fontFamily: { mono: ["'JetBrains Mono'", "monospace"] }
    }
  },
  plugins: []
};
