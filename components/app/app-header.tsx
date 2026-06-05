"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            World Cup 2026
          </p>
          <h1 className="text-lg font-semibold">WC Fantasy</h1>
        </div>

        {status === "loading" ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <span className="max-w-24 truncate text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
