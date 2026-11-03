"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Eraser, Loader2, Repeat, Trash2, X } from "lucide-react";
import { notify } from "@/components/FeedbackHost";
import {
  CALENDAR_HOURS, KIND_META, PAINT_KINDS, WEEKDAYS, addDays, cellKey, formatDayHeader, formatHour, formatWeekRange,
  type CalendarCell, type CalendarKind, type CalendarWeek, type PaintKind,
} from "@/lib/calendar-shared";
import type { CalendarActionResult } from "@/lib/calendar-actions";

type Props = {
  week: CalendarWeek;
  basePath: string; // page path used for week navigation (?week=YYYY-MM-DD)
  editable: boolean;
  action?: (formData: FormData) => Promise<CalendarActionResult>;
  title?: string;
  description?: string;
  // Client portal limits: colors the person may apply, and cells (by current color) they may select.
  paintKinds?: PaintKind[];
  selectableKinds?: CalendarKind[];
  ruleKinds?: CalendarKind[];
};

const LEGEND: CalendarKind[] = ["student_visit", "client_meeting", "other", "blocked", "open"];

export function AvailabilityCalendar({ week, basePath, editable, action, title = "Calendrier", description, paintKinds, selectableKinds, ruleKinds }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const drag = useRef<{ adding: boolean } | null>(null);

  const cells = useMemo(() => new Map(week.cells.map((cell) => [cellKey(cell.day, cell.hour), cell])), [week.cells]);
  const isPast = (day: string) => day < week.today;
  const selectable = (cell: CalendarCell | undefined) => Boolean(editable && cell && !cell.locked && !isPast(cell.day) && (!selectableKinds || selectableKinds.includes(cell.kind)));

  useEffect(() => {
    const stop = () => { drag.current = null; };
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  function setKeys(keys: string[], adding: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const key of keys) {
        if (!selectable(cells.get(key))) continue;
        if (adding) next.add(key); else next.delete(key);
      }
      return next;
    });
  }

  function toggleGroup(keys: string[]) {
    const usable = keys.filter((key) => selectable(cells.get(key)));
    setKeys(usable, !usable.every((key) => selected.has(key)));
  }

  function submit(build: (formData: FormData) => void, after?: () => void) {
    if (!action) return;
    const formData = new FormData();
    build(formData);
    startTransition(async () => {
      let result: CalendarActionResult;
      try {
        result = await action(formData);
      } catch (error) {
        notify.error(error instanceof Error && error.message !== "An unexpected response was received from the server."
          ? error.message
          : "Le serveur n’a pas pu enregistrer. Recharge la page et réessaie.");
        return;
      }
      if (result.ok) {
        notify.success(result.message);
        after?.();
        router.refresh();
      } else {
        notify.error(result.error);
      }
    });
  }

  function paint(kind: PaintKind) {
    submit((formData) => {
      formData.set("op", "paint");
      formData.set("kind", kind);
      formData.set("label", label);
      formData.set("cells", [...selected].join(","));
    }, () => { setSelected(new Set()); setLabel(""); });
  }

  const prev = `${basePath}?week=${addDays(week.start, -7)}`;
  const next = `${basePath}?week=${addDays(week.start, 7)}`;

  return (
    <div className="calendar">
      <section className="panel calendar-panel" aria-labelledby="calendar-title">
        <header className="calendar-head">
          <div>
            <h3 id="calendar-title">{title}</h3>
            <p>{description ?? formatWeekRange(week.start)}</p>
          </div>
          <nav className="calendar-nav" aria-label="Changer de semaine">
            <Link href={prev} className="table-link" aria-label="Semaine précédente" scroll={false}><ChevronLeft size={16} aria-hidden="true" /></Link>
            <Link href={basePath} className="table-link" scroll={false}><CalendarDays size={15} aria-hidden="true" />Cette semaine</Link>
            <Link href={next} className="table-link" aria-label="Semaine suivante" scroll={false}><ChevronRight size={16} aria-hidden="true" /></Link>
          </nav>
        </header>
        {description && <p className="calendar-range">{formatWeekRange(week.start)}</p>}

        <ul className="calendar-legend" aria-label="Légende">
          {LEGEND.map((kind) => <li key={kind}><span className={`swatch kind-${kind}`} aria-hidden="true" />{KIND_META[kind].label}</li>)}
        </ul>

        {editable && <p className="calendar-hint">Clique ou fais glisser sur les créneaux pour les sélectionner. Clique sur un jour ou une heure pour sélectionner toute la colonne ou la ligne.</p>}

        <div className="calendar-scroll">
          <div className="calendar-grid" role="grid" aria-label={`Semaine du ${formatWeekRange(week.start)}`} onPointerLeave={() => { drag.current = null; }}>
            <div className="calendar-corner" role="presentation" />
            {week.days.map((day) => {
              const head = formatDayHeader(day);
              const keys = CALENDAR_HOURS.map((hour) => cellKey(day, hour));
              return (
                <button key={day} type="button" role="columnheader" className="calendar-day" data-today={day === week.today || undefined} data-past={isPast(day) || undefined}
                  disabled={!editable || isPast(day)} onClick={() => toggleGroup(keys)} title={editable ? "Sélectionner toute la journée" : undefined}>
                  <span>{head.weekday}</span><strong>{head.day}</strong><small>{head.month}</small>
                </button>
              );
            })}

            {CALENDAR_HOURS.map((hour) => (
              <div key={hour} className="calendar-row" role="row">
                <button type="button" role="rowheader" className="calendar-hour" disabled={!editable}
                  onClick={() => toggleGroup(week.days.map((day) => cellKey(day, hour)))} title={editable ? "Sélectionner cette heure toute la semaine" : undefined}>
                  {formatHour(hour)}<small>{formatHour(hour + 1)}</small>
                </button>
                {week.days.map((day) => {
                  const key = cellKey(day, hour);
                  const cell = cells.get(key)!;
                  const canSelect = selectable(cell);
                  const isSelected = selected.has(key);
                  const text = `${formatDayHeader(day).weekday} ${formatDayHeader(day).day} · ${formatHour(hour)} – ${formatHour(hour + 1)} · ${KIND_META[cell.kind].label}${cell.label ? ` · ${cell.label}` : ""}`;
                  return (
                    <button key={key} type="button" role="gridcell" className={`calendar-cell kind-${cell.kind}`}
                      data-source={cell.source} data-past={isPast(day) || undefined} aria-selected={isSelected} aria-label={text} title={text}
                      disabled={!canSelect}
                      onPointerDown={(event) => {
                        if (!canSelect) return;
                        event.preventDefault();
                        const adding = !isSelected;
                        drag.current = { adding };
                        setKeys([key], adding);
                      }}
                      onPointerEnter={() => { if (drag.current && canSelect) setKeys([key], drag.current.adding); }}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setKeys([key], !isSelected); } }}>
                      {cell.kind !== "open" && <span className="calendar-cell-text">{cell.source === "rule" ? <Repeat size={11} aria-hidden="true" /> : null}{cell.label && cell.source !== "rule" ? cell.label : KIND_META[cell.kind].short}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {editable && selected.size > 0 && (
        <div className="calendar-toolbar" role="region" aria-label="Créneaux sélectionnés">
          <div className="calendar-toolbar-head">
            <strong>{selected.size} créneau{selected.size > 1 ? "x" : ""} sélectionné{selected.size > 1 ? "s" : ""}</strong>
            <button type="button" className="ghost-icon" aria-label="Tout désélectionner" onClick={() => setSelected(new Set())}><X size={16} aria-hidden="true" /></button>
          </div>
          {!paintKinds && (
            <label className="calendar-label-input">
              <span className="sr-only">Note (facultatif)</span>
              <input value={label} maxLength={120} placeholder="Note (facultatif) : nom, motif…" onChange={(event) => setLabel(event.target.value)} />
            </label>
          )}
          <div className="calendar-paint">
            {PAINT_KINDS.filter(({ kind }) => !paintKinds || paintKinds.includes(kind)).map(({ kind, label: kindLabel }) => (
              <button key={kind} type="button" className={`paint-button paint-${kind}`} disabled={pending} onClick={() => paint(kind)}>
                {kind === "clear" ? <Eraser size={14} aria-hidden="true" /> : <span className={`swatch kind-${kind}`} aria-hidden="true" />}
                {kindLabel}
              </button>
            ))}
            {pending && <Loader2 className="spin" size={16} aria-label="Enregistrement…" />}
          </div>
        </div>
      )}

      {editable && <RulesPanel week={week} pending={pending} onSubmit={submit} kinds={ruleKinds} />}
      {!editable && week.rules.length > 0 && <RulesPanel week={week} pending={pending} readOnly />}
    </div>
  );
}

function ruleText(rule: { weekday: number; hour: number | null }) {
  const day = WEEKDAYS.find((item) => item.value === rule.weekday)?.long ?? "";
  return `${day} · ${rule.hour === null ? "toute la journée" : `${formatHour(rule.hour)} – ${formatHour(rule.hour + 1)}`}`;
}

function RulesPanel({ week, pending, onSubmit, readOnly = false, kinds = ["blocked", "client_meeting", "other"] }: {
  week: CalendarWeek; pending: boolean; readOnly?: boolean; kinds?: CalendarKind[];
  onSubmit?: (build: (formData: FormData) => void, after?: () => void) => void;
}) {
  const [days, setDays] = useState<Set<number>>(() => new Set());
  const [hours, setHours] = useState<Set<number>>(() => new Set());
  const [allDay, setAllDay] = useState(true);
  const [kind, setKind] = useState<CalendarKind>("blocked");

  const toggle = <T,>(set: Set<T>, value: T) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const ready = days.size > 0 && (allDay || hours.size > 0);

  function apply() {
    onSubmit?.((formData) => {
      formData.set("op", "rule");
      formData.set("kind", kind);
      if (allDay) formData.set("allDay", "on");
      days.forEach((day) => formData.append("weekday", String(day)));
      hours.forEach((hour) => formData.append("hour", String(hour)));
    }, () => { setDays(new Set()); setHours(new Set()); });
  }

  return (
    <section className="panel calendar-rules" aria-labelledby="rules-title">
      <header className="panel-header">
        <div>
          <h3 id="rules-title"><Repeat size={16} aria-hidden="true" /> Règles hebdomadaires</h3>
          <p>{readOnly ? "Ces créneaux se répètent chaque semaine." : "Ex. : dimanche toujours indisponible. Une case marquée à la main l’emporte sur la règle."}</p>
        </div>
      </header>

      {!readOnly && (
        <div className="rule-form">
          <fieldset>
            <legend>Jours</legend>
            <div className="check-grid">
              {WEEKDAYS.map((day) => (
                <label key={day.value} className="check-chip">
                  <input type="checkbox" checked={days.has(day.value)} onChange={() => setDays((current) => toggle(current, day.value))} />
                  <span>{day.long}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Heures</legend>
            <div className="check-grid">
              <label className="check-chip">
                <input type="checkbox" checked={allDay} onChange={() => setAllDay((value) => !value)} />
                <span>Toute la journée</span>
              </label>
              {!allDay && CALENDAR_HOURS.map((hour) => (
                <label key={hour} className="check-chip">
                  <input type="checkbox" checked={hours.has(hour)} onChange={() => setHours((current) => toggle(current, hour))} />
                  <span>{formatHour(hour)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="rule-apply">
            <label className="form-field">
              <span className="field-label-text">Marquer comme</span>
              <select value={kind} onChange={(event) => setKind(event.target.value as CalendarKind)}>
                {kinds.map((value) => <option key={value} value={value}>{KIND_META[value].label}</option>)}
              </select>
            </label>
            <button type="button" className="button-dark" disabled={!ready || pending} onClick={apply}>
              {pending && <Loader2 className="spin" size={16} aria-hidden="true" />}Appliquer chaque semaine
            </button>
          </div>
        </div>
      )}

      {week.rules.length > 0 && (
        <ul className="rule-list">
          {week.rules.map((rule) => (
            <li key={rule.id}>
              <span className={`swatch kind-${rule.kind}`} aria-hidden="true" />
              <span><strong>{ruleText(rule)}</strong><small>{KIND_META[rule.kind].label}</small></span>
              {!readOnly && kinds.includes(rule.kind) && (
                <button type="button" className="table-link danger-link" disabled={pending}
                  onClick={() => onSubmit?.((formData) => { formData.set("op", "delete-rule"); formData.set("ruleId", rule.id); })}>
                  <Trash2 size={14} aria-hidden="true" />Retirer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
