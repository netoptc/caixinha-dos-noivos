import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1280px",
      },
    },
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
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Dourado profundo — primária editorial
        gold: {
          50:  "#fbf6e6",
          100: "#f5e9be",
          200: "#ecd285",
          300: "#dfb649",
          400: "#cb9a25",
          500: "#b8851f", // PRIMARY — #B8851F dourado profundo
          600: "#946919",
          700: "#714f15",
          800: "#503811",
          900: "#33240b",
        },
        // Marfim / creme suave — secundária
        cream: {
          50:  "#fbf7ee", // BACKGROUND — marfim
          100: "#f6efde",
          200: "#ede0c0", // SECONDARY
          300: "#dec898",
          400: "#c8aa6c",
          500: "#a98847",
        },
        // Verde-musgo — acento editorial
        moss: {
          50:  "#f1f3ef",
          100: "#dde2d9",
          200: "#bbc6b4",
          300: "#94a48b",
          400: "#6f8265",
          500: "#4a5c44", // ACCENT — verde-musgo
          600: "#3a4936",
          700: "#2d382a",
          800: "#1f261d",
          900: "#121711",
        },
        // Tinta — foreground / texto
        ink: {
          50:  "#f3efea",
          100: "#dcd4c8",
          200: "#b9aa95",
          300: "#917f66",
          400: "#6a5942",
          500: "#3d3122",
          600: "#2c2418",
          700: "#1f190f",
          800: "#15110a",
          900: "#0a0805",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        script: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
      },
      letterSpacing: {
        editorial: "0.22em",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.4s linear infinite",
        "progress-stripes": "progress-stripes 1.2s linear infinite",
        "progress-pulse": "progress-pulse 2s ease-in-out infinite",
        "progress-sweep": "progress-sweep 2.6s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out both",
        "slide-up": "slideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "reveal-up": "revealUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-horizontal": "slideHorizontal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rule-draw": "ruleDraw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "progress-stripes": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "28px 0" },
        },
        "progress-pulse": {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        "progress-sweep": {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "60%, 100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        revealUp: {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideHorizontal: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        ruleDraw: {
          from: { transform: "scaleX(0)", transformOrigin: "left" },
          to: { transform: "scaleX(1)", transformOrigin: "left" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
