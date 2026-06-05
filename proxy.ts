import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";

export default auth((request) => {
  const isLoggedIn = !!request.auth;
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/matches") ||
    pathname.startsWith("/leaderboard");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.nextUrl);
    const callbackPath =
      pathname === "/" ? "/matches" : `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isLoggedIn &&
    (pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/matches", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/matches/:path*", "/leaderboard/:path*", "/login", "/register"],
};
