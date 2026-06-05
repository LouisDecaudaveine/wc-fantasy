"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/matches", label: "Matches", icon: CalendarDays },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex max-w-md">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
