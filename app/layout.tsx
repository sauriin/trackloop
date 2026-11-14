import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://trackloop.local"),
  title: {
    default: "TrackLoop — daily tracker",
    template: "%s · TrackLoop",
  },
  description: "Track office tasks, gym, nutrition, investments and reminders in one place.",
  applicationName: "TrackLoop",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TrackLoop",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh pb-28">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
