import { createTheme } from "@mantine/core";

export const bondeeTheme = createTheme({
  cursorType: "pointer",
  primaryColor: "branding-primary",
  defaultRadius: "md",
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
        classNames: {
          card: "button-scale-effect",
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: "md",
      },
    },
    NavLink: {
      defaultProps: {
        className: "button-scale-effect rounded-sm",
      },
    },
  },
});
