import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/permissions";

export default async function Home() {
  const state = await getSessionState();
  if (state.status === "active") redirect(`/${homeFor(state.context.permissions)}`);
  redirect(state.status === "needs_2fa" ? "/verify" : "/login");
}
