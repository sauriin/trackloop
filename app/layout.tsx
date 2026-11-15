import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TaskProvider } from "@/components/task-provider";

export const metadata: Metadata = {
  title: "Daily — task tracker",
  description: "Track daily tasks across office, home, family and more.",
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <TaskProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 lg:px-12 lg:py-10">
              {children}
            </main>
          </div>
        </TaskProvider>
      </body>
    </html>
  );
}
