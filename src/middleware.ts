import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect admin routes — require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      const loginUrl = new URL("/entrar", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (req.auth.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/painel", req.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/painel")) {
    if (!req.auth?.user) {
      const loginUrl = new URL("/entrar", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged in users away from auth pages
  if ((pathname.startsWith("/entrar") || pathname.startsWith("/criar-caixinha")) && req.auth?.user) {
    const target = req.auth.user.role === "ADMIN" ? "/admin" : "/painel";
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/painel/:path*",
    "/admin/:path*",
    "/entrar",
    "/criar-caixinha",
  ],
};
