import { Card, createTheme, MantineTheme } from "@mantine/core";

export const bonderyTheme = createTheme({
  cursorType: "pointer",
  primaryColor: "branding-primary",
  defaultRadius: "md",
  fontFamily: "Lexend, sans-serif",

  colors: {
    "branding-primary": [
      "#faedff",
      "#edd9f7",
      "#d8b1ea",
      "#c186dd",
      "#ae62d2",
      "#a34bcb",
      "#9d3fc9",
      "#8931b2",
      "#7a2aa0",
      "#6b218d",
    ],
  },
  components: {
    Menu: {
      defaultProps: {
        shadow: "md",
      },
    },
    Button: {
      defaultProps: {
        className: "button-scale-effect",
      },
    },
    Input: {
      defaultProps: {
        className: "input-scale-effect",
      },
    },
    Checkbox: {
      defaultProps: {
        className: {
          card: "button-scale-effect",
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "var(--mantine-radius-default)",
        shadodow: "sm",
      },
    },

    Paper: {
      defaultProps: {
        radius: "md",
        withBorder: true,
        shadow: "sm",
      },
    },
    NavLink: {
      defaultProps: {
        className: "button-scale-effect",
      },
      styles: {
        root: {
          borderRadius: "var(--mantine-radius-xs)",
        },
      },
    },
  },
});
