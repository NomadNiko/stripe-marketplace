import {
  MantineProvider,
  createTheme,
  ColorSchemeScript,
  MantineTheme,
  rgba,
} from "@mantine/core";
import { oxanium } from "@/config/fonts";
import "@mantine/core/styles.css";

// Create a darker theme to match iXplor
const theme = createTheme({
  primaryColor: "blue",
  // Remove colorScheme from theme object, it's applied at provider level
  colors: {
    blue: [
      "#E6F7FF",
      "#BAE7FF",
      "#91D5FF",
      "#69C0FF",
      "#40A9FF",
      "#1890FF",
      "#096DD9",
      "#0050B3",
      "#003A8C",
      "#002766",
    ],
    // Dark theme colors
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1C283A", // Same as iXplor background
      "#141517",
      "#101113",
    ],
  },
  fontFamily: `${oxanium.style.fontFamily}, system-ui, sans-serif`,
  components: {
    Button: {
      defaultProps: {
        size: "md",
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: "md",
        radius: "md",
        p: "lg",
      },
      // Use static styles instead of functions
      styles: {
        root: {
          backgroundColor: "#1C283A", // Hardcoded dark[7] value
        },
      },
    },
    Alert: {
      // Use static styles instead of functions
      styles: {
        root: {
          backgroundColor: "rgba(44, 46, 51, 0.65)", // Hardcoded rgba value
        },
      },
    },
    // Add Stripe Connect specific styling
    Modal: {
      styles: {
        body: {
          ".connect-onboarding-container": {
            minHeight: "600px",
          },
        },
      },
    },
  },
});

export function MantineProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        {children}
      </MantineProvider>
    </>
  );
}

// Replace InitColorSchemeScript with this component
export function InitColorSchemeScript() {
  return <ColorSchemeScript defaultColorScheme="dark" />;
}
