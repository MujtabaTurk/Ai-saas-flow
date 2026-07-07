/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/features/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        growth: {
          emerald: "#10B981",
          forest: "#3525CD",
          mint: "#D5E0F8",
          dashboard: "#F8F9FF",
          sidebar: "#0B1C30",
          border: "#C7C4D8"
        },
        serviceflow: {
          canvas: "#F8F9FF",
          panel: "#FFFFFF",
          panelSoft: "#EFF4FF",
          border: "#C7C4D8",
          ink: "#0B1C30",
          muted: "#464555",
          subtle: "#586377",
          brand: "#3525CD",
          brandSoft: "#D5E0F8",
          brandMist: "#E5EEFF"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans Variable",
          "Noto Sans Arabic Variable",
          "Noto Nastaliq Urdu Variable",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
