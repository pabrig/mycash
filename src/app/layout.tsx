import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { FinanceProvider } from "@/context/FinanceContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Myca$h — Finanzas personales",
  description: "Control de ingresos y gastos personales. Tu plata, clara y al día.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Myca$h",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-zinc-900 dark:text-zinc-100">
        <FinanceProvider>
          <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-36 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <main className="flex-1">{children}</main>
          </div>
          <BottomNav />
          <ServiceWorkerRegister />
        </FinanceProvider>
      </body>
    </html>
  );
}
