import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VedaAI - Assessment Creator",
  description: "Generate high-quality AI school assessments seamlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <div className="flex min-h-screen">
          
          {/* Universal Left Hand Persistent Sidebar Layout - Completely Hidden on Print! */}
          <div className="print:hidden flex shrink-0">
            <Sidebar />
          </div>
          
          {/* Main Body Content Frame Workspace - Padding stripped automatically for standard print bounds */}
          <main className="flex-1 overflow-y-auto px-8 py-6 print:p-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}