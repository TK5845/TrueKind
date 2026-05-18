import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, getSupabaseConfigIssue } from "./utils/supabase/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  if (getSupabaseConfigIssue()) {
    return response;
  }

  const { url, key } = getSupabaseConfig();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
