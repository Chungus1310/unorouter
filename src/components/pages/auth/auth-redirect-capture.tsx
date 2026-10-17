"use client";

import {
  AUTH_REDIRECT_COOKIE,
  AUTH_REDIRECT_QUERY,
} from "@/lib/config/constants";
import { sameOriginPath } from "@/lib/utils/client";
import { setCookie } from "cookies-next/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AuthRedirectCapture() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = sameOriginPath(searchParams.get(AUTH_REDIRECT_QUERY));
    if (!target) return;
    setCookie(AUTH_REDIRECT_COOKIE, target, { maxAge: 600 });
    const next = new URLSearchParams(searchParams.toString());
    next.delete(AUTH_REDIRECT_QUERY);
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
