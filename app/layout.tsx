// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Navbar from "./components/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import Provider from "./provider";
import { AppSidebar } from "./components/Appsidebar";
import { AppearanceProvider } from "./context/AppearanceContext";
import { CyberRain } from "./components/CyberRain";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Fit Counsellor",
  description: "AI Fitness and weight loss counsellor",
};

// Runs before first paint so the saved accent / text size show immediately
// (no flash of the default look). Must stay in sync with AppearanceContext's
// STORAGE_KEY.
const APPEARANCE_BOOT_SCRIPT = `try{var a=JSON.parse(localStorage.getItem("fitcoach-appearance")||"null");if(a){var r=document.documentElement;if(a.accent)r.dataset.accent=a.accent;if(a.uiSize)r.dataset.size=a.uiSize;r.dataset.glow=a.glow===false?"off":"on"}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConvexClientProvider>
              <Provider>
                <AppearanceProvider>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full flex-col">
                      <Navbar />
                      <div className="flex flex-1 overflow-hidden">
                        <AppSidebar />

                        {/* Rain lives inside this wrapper, so it can't reach the sidebar */}
                        <div className="relative flex min-w-0 flex-1 overflow-hidden">
                          <CyberRain />
                          <SidebarInset className="flex-1 overflow-auto">
                            <main className="p-4 lg:p-6">{children}</main>
                          </SidebarInset>
                        </div>
                      </div>
                    </div>
                  </SidebarProvider>

                  <Toaster richColors />
                </AppearanceProvider>
              </Provider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
