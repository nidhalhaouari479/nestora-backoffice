import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { LandlordForm } from "../LandlordForm";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewLandlordPage() {
  await requirePermission("landlords.manage", "landlords");
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Clients</p>
          <h2>Nouveau client</h2>
          <p>Le propriétaire pourra ensuite être associé à une ou plusieurs maisons.</p>
        </div>
      </div>
      <LandlordForm />
    </div>
  );
}
