import forms from '@tailwindcss/forms'; // <-- Thêm dòng này
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Quét tất cả file trong src
  ],
  theme: {
    extend: {
      colors: {
        "on-background": "#131b2e",
        "on-tertiary-container": "#67f4b7",
        "tertiary-container": "#006e4b",
        "secondary": "#5654a8",
        "surface-container": "#eaedff",
        "on-secondary-fixed-variant": "#3e3c8f",
        "surface-container-high": "#e2e7ff",
        "inverse-surface": "#283044",
        "tertiary-fixed-dim": "#4edea3",
        "surface-bright": "#faf8ff",
        "on-surface": "#131b2e",
        "surface-tint": "#4d44e3",
        "primary": "#3525cd",
        "on-tertiary": "#ffffff",
        "surface-dim": "#d2d9f4",
        "error": "#ba1a1a",
        "tertiary": "#005338",
        "on-secondary-container": "#393689",
        "secondary-fixed": "#e2dfff",
        "on-error": "#ffffff",
        "on-primary-fixed-variant": "#3323cc",
        "secondary-container": "#a7a5ff",
        "on-tertiary-fixed": "#002113",
        "on-secondary-fixed": "#100563",
        "on-error-container": "#93000a",
        "error-container": "#ffdad6",
        "outline-variant": "#c7c4d8",
        "surface-container-low": "#f2f3ff",
        "on-primary": "#ffffff",
        "on-tertiary-fixed-variant": "#005236",
        "surface-container-lowest": "#ffffff",
        "background": "#faf8ff",
        "tertiary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#c3c0ff",
        "surface": "#faf8ff",
        "surface-variant": "#dae2fd",
        "outline": "#777587",
        "on-secondary": "#ffffff",
        "inverse-primary": "#c3c0ff",
        "primary-fixed-dim": "#c3c0ff",
        "on-surface-variant": "#464555",
        "on-primary-fixed": "#0f0069",
        "inverse-on-surface": "#eef0ff",
        "on-primary-container": "#dad7ff",
        "surface-container-highest": "#dae2fd",
        "primary-container": "#4f46e5",
        "primary-fixed": "#e2dfff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontSize: {
        "display-lg": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "headline-lg": ["2rem", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        "headline-md": ["1.5rem", { lineHeight: "1.3" }],
        "headline-sm": ["1.25rem", { lineHeight: "1.35" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.45" }],
        "label-sm": ["0.75rem", { lineHeight: "1.35", letterSpacing: "0.02em" }]
      }
    },
  },
  plugins: [
    forms,
  ],
}