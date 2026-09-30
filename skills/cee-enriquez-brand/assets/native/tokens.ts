// Generado por scripts/build.py. No editar.
export const ceeTokens = {
  "version": "1.0.0",
  "brand": {
    "name": "CEE Enriquez",
    "graphite": "#211C18",
    "gray": "#5D6166",
    "white": "#FFFFFF"
  },
  "themes": {
    "light": {
      "bg": "#f5f5f4",
      "surface": "#fff",
      "surface-alt": "#efefed",
      "text": "#211c18",
      "muted": "#5d6166",
      "line": "#dededc",
      "control": "#81817b",
      "primary": "#211c18",
      "on-primary": "#fff",
      "hover": "#e6e6e2",
      "success": "#285e46",
      "success-bg": "#edf5ef",
      "warning": "#795315",
      "warning-bg": "#faf3e5",
      "danger": "#a13632",
      "danger-bg": "#fbefed",
      "info": "#365c78",
      "info-bg": "#edf3f8",
      "focus": "#365c78",
      "shadow": "0 12px 36px #211c181c"
    },
    "dark": {
      "bg": "#191918",
      "surface": "#232322",
      "surface-alt": "#2d2d2b",
      "text": "#f3f1ed",
      "muted": "#b9b9b3",
      "line": "#444440",
      "control": "#888880",
      "primary": "#eeeae3",
      "on-primary": "#211c18",
      "hover": "#3a3a36",
      "success": "#a1cfb3",
      "success-bg": "#23372c",
      "warning": "#e3c382",
      "warning-bg": "#3b3222",
      "danger": "#f0aaa4",
      "danger-bg": "#402c2b",
      "info": "#afc9e0",
      "info-bg": "#273743",
      "focus": "#afc9e0",
      "shadow": "0 12px 36px #0005"
    }
  },
  "typography": {
    "families": {
      "web": "'Mark Pro', Arial, sans-serif",
      "nativeFallback": {
        "ios": "System",
        "android": "sans-serif"
      }
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "bold": 700
    },
    "sizes": {
      "body": 16,
      "control": 14,
      "button": 13,
      "table": 12,
      "caption": 12,
      "page-title": 28,
      "section-title": 22
    }
  },
  "geometry": {
    "spacing": [
      4,
      8,
      12,
      16,
      24,
      32
    ],
    "radius": {
      "control": 6,
      "panel": 8
    },
    "controlHeight": {
      "compact": 32,
      "default": 36,
      "large": 44,
      "touch": 48
    }
  }
} as const;
export const ceeThemes = ceeTokens.themes;
