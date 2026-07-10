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
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          soft: "hsl(var(--primary-soft) / <alpha-value>)",
          mist: "hsl(var(--primary-mist) / <alpha-value>)"
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
          emerald: "hsl(var(--success) / <alpha-value>)",
          forest: "hsl(var(--primary) / <alpha-value>)",
          mint: "hsl(var(--primary-soft) / <alpha-value>)",
          dashboard: "hsl(var(--sf-canvas) / <alpha-value>)",
          sidebar: "hsl(var(--sf-ink) / <alpha-value>)",
          border: "hsl(var(--sf-border) / <alpha-value>)"
        },
        serviceflow: {
          canvas: "hsl(var(--sf-canvas) / <alpha-value>)",
          canvasAlt: "hsl(var(--sf-canvas-alt) / <alpha-value>)",
          panel: "hsl(var(--sf-panel) / <alpha-value>)",
          panelElevated: "hsl(var(--sf-panel-elevated) / <alpha-value>)",
          panelSoft: "hsl(var(--sf-panel-soft) / <alpha-value>)",
          border: "hsl(var(--sf-border) / <alpha-value>)",
          borderSoft: "hsl(var(--sf-border-soft) / <alpha-value>)",
          ink: "hsl(var(--sf-ink) / <alpha-value>)",
          muted: "hsl(var(--sf-muted) / <alpha-value>)",
          subtle: "hsl(var(--sf-subtle) / <alpha-value>)",
          brand: "hsl(var(--primary) / <alpha-value>)",
          brandHover: "hsl(var(--primary-hover) / <alpha-value>)",
          brandSoft: "hsl(var(--primary-soft) / <alpha-value>)",
          brandMist: "hsl(var(--primary-mist) / <alpha-value>)",
          success: "hsl(var(--success) / <alpha-value>)",
          successBg: "hsl(var(--success-bg) / <alpha-value>)",
          warning: "hsl(var(--warning) / <alpha-value>)",
          warningBg: "hsl(var(--warning-bg) / <alpha-value>)",
          error: "hsl(var(--error) / <alpha-value>)",
          errorBg: "hsl(var(--error-bg) / <alpha-value>)"
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
