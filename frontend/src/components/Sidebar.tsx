"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  FileText, 
  Wand2, 
  Library, 
  Settings, 
  Sparkles 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // Navigation Items matching the Figma sidebar links
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "My Groups", href: "#", icon: Users },
    { name: "Assignments", href: "/", icon: FileText }, // Anchored to our main list dashboard
    { name: "AI Teacher's Toolkit", href: "#", icon: Wand2 },
    { name: "My Library", href: "#", icon: Library },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen sticky top-0 px-4 py-6 shadow-sm">
      {/* Top Section: Branding & Main CTAs */}
      <div>
        {/* Brand Logo Display */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="bg-gradient-to-tr from-orange-500 to-amber-600 text-white rounded-lg p-1.5 flex items-center justify-center font-bold text-xl h-9 w-9 shadow-sm">
            V
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">
            Veda<span className="text-orange-500">AI</span>
          </span>
        </div>

        {/* Primary Action Button: Create Assignment */}
        <Link href="/create" className="w-full">
          <button className="w-full bg-[#1a1a1a] hover:bg-black text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all mb-6 group shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
            Create Assignment
          </button>
        </Link>

        {/* Main Route Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight link if path matches or if it's the home dashboard
            const isActive = pathname === item.href;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                  {item.name}
                  {item.name === "Assignments" && (
                    <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      10
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & Institutional Profile Selector */}
      <div className="space-y-4">
        {/* Settings Action Link */}
        <Link href="#">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer">
            <Settings className="h-5 w-5 text-gray-400" />
            Settings
          </div>
        </Link>

        <hr className="border-gray-200" />

        {/* Institutional Card Anchor: Delhi Public School */}
        <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shadow-sm text-xs text-center leading-tight p-1">
            DPS
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              Delhi Public School
            </h4>
            <p className="text-xs text-gray-400 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}