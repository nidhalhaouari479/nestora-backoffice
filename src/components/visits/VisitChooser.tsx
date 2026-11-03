"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import { notify } from "@/components/FeedbackHost";
import { CALENDAR_HOURS, formatHour } from "@/lib/calendar-shared";

export type ChooserProposal = { date: string; start: string; end: string; free: boolean };
export type ChooserResult = { ok: true; message: string } | { ok: false; error: string };

type Props = {
  visitId: string;
  proposals: ChooserProposal[];
  minDate: string;
  maxDate: string;
  action: (formData: FormData) => Promise<ChooserResult>;
  compact?: boolean;
};

function dayLabel(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00Z`));
}

// Accept one of the student's proposals, or pick another one-hour slot (8:00 → 19:00).
// The database confirms only if the slot is free in the Nestora calendar AND the client's calendar.
export function VisitChooser({ visitId, proposals, minDate, maxDate, action, compact = false }: Props) {
  const router = useRouter();
  const firstFree = proposals.find((proposal) => proposal.free);
  const [choice, setChoice] = useState<string>(firstFree ? `p:${firstFree.date}|${Number(firstFree.start.slice(0, 2))}` : "other");
  const [otherDate, setOtherDate] = useState(minDate);
  const [otherHour, setOtherHour] = useState("10");
  const [pending, startTransition] = useTransition();
  const name = `choice-${visitId}`;

  function submit() {
    const [date, hour] = choice === "other" ? [otherDate, otherHour] : choice.slice(2).split("|");
    const formData = new FormData();
    formData.set("id", visitId);
    formData.set("date", date);
    formData.set("hour", hour);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.ok) { notify.success(result.message); router.refresh(); }
        else notify.error(result.error);
      } catch {
        notify.error("Le serveur n’a pas pu confirmer la visite. Recharge la page et réessaie.");
      }
    });
  }

  return (
    <div className={`visit-chooser ${compact ? "is-compact" : ""}`}>
      <fieldset>
        <legend className={compact ? "sr-only" : undefined}>Créneaux proposés par l’étudiant</legend>
        <div className="chooser-options">
          {proposals.map((proposal) => {
            const value = `p:${proposal.date}|${Number(proposal.start.slice(0, 2))}`;
            return (
              <label key={value} className="chooser-option" data-busy={!proposal.free || undefined}>
                <input type="radio" name={name} value={value} checked={choice === value} disabled={!proposal.free} onChange={() => setChoice(value)} />
                <span>
                  <strong>{dayLabel(proposal.date)}</strong>
                  <small>{proposal.start.slice(0, 5)} – {proposal.end.slice(0, 5)}{proposal.free ? "" : " · occupé"}</small>
                </span>
              </label>
            );
          })}
          <label className="chooser-option">
            <input type="radio" name={name} value="other" checked={choice === "other"} onChange={() => setChoice("other")} />
            <span><strong><CalendarClock size={14} aria-hidden="true" /> Autre créneau</strong><small>Choisir une autre date et heure</small></span>
          </label>
        </div>
      </fieldset>

      {choice === "other" && (
        <div className="chooser-other">
          <label className="form-field">
            <span className="field-label-text">Date</span>
            <input type="date" value={otherDate} min={minDate} max={maxDate} onChange={(event) => setOtherDate(event.target.value)} />
          </label>
          <label className="form-field">
            <span className="field-label-text">Heure</span>
            <select value={otherHour} onChange={(event) => setOtherHour(event.target.value)}>
              {CALENDAR_HOURS.map((hour) => <option key={hour} value={hour}>{formatHour(hour)} – {formatHour(hour + 1)}</option>)}
            </select>
          </label>
        </div>
      )}

      <button type="button" className="button-dark button-small" disabled={pending || (choice === "other" && !otherDate)} onClick={submit}>
        {pending ? <Loader2 className="spin" size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
        Confirmer la visite
      </button>
    </div>
  );
}
