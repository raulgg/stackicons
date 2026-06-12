import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        '"Noto Sans"',
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
      // Charter is gone; serif headings render with the UI system stack.
      serif: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        '"Noto Sans"',
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        '"SF Mono"',
        "Menlo",
        "Consolas",
        '"Liberation Mono"',
        "monospace",
      ],
    },
    extend: {
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          strong: "hsl(var(--border-strong))",
          ink: "hsl(var(--border-ink))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ink: {
          DEFAULT: "hsl(var(--foreground))",
          2: "hsl(var(--ink-2))",
          3: "hsl(var(--ink-3))",
        },
        surface: {
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          ink: "hsl(var(--accent-ink))",
          bright: "hsl(var(--accent-bright))",
          soft: "hsl(var(--accent-soft))",
          "soft-2": "hsl(var(--accent-soft-2))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          soft: "hsl(var(--danger-soft))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        code: {
          bg: "hsl(var(--code-bg))",
          "bg-2": "hsl(var(--code-bg-2))",
          ink: "hsl(var(--code-ink))",
        },
        syntax: {
          tag: "hsl(var(--syntax-tag))",
          attribute: "hsl(var(--syntax-attribute))",
          string: "hsl(var(--syntax-string))",
          punctuation: "hsl(var(--syntax-punctuation))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        // Primer has only two shadows: a subtle button bevel and an
        // overlay shadow for dropdowns, popovers, and dialogs.
        sm: "var(--shadow-button)",
        DEFAULT: "var(--shadow-button)",
        md: "var(--shadow-overlay)",
        lg: "var(--shadow-overlay)",
        button: "var(--shadow-button)",
        overlay: "var(--shadow-overlay)",
      },
    },
  },
  plugins: [],
};

export default config;
