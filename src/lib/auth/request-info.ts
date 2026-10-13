import { headers } from "next/headers";

export async function requestInfo() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || headerList.get("x-real-ip") || null,
    userAgent: headerList.get("user-agent")?.slice(0, 400) ?? null,
  };
}
