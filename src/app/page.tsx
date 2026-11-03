import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/permissions";
import { getLandlordAccount } from "@/lib/auth/landlord";

export default async function Home() {
  const state = await getSessionState();
  if (state.status === "active") redirect(`/${homeFor(state.context.permissions)}`);
  if (state.status === "not_staff" && (await getLandlordAccount())) redirect("/client");
  redirect(state.status === "needs_2fa" ? "/api/auth/logout?reason=relogin" : "/login");
}
