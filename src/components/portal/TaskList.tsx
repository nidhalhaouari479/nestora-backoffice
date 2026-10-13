import Link from "next/link";
import type { OpsTask, Tone } from "@/lib/ops";

const KIND_ROUTES: Record<string, string> = {
  payment: "/payments",
  visit: "/visits",
  contract: "/contracts",
  hold: "/holds",
  availability: "/availability",
  follow_up: "/rent",
};

export function TonePill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function TaskList({ tasks, withAction = false, emptyLabel }: { tasks: OpsTask[]; withAction?: boolean; emptyLabel: string }) {
  if (tasks.length === 0) return <p className="panel-empty">{emptyLabel}</p>;
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <span className={`task-avatar avatar-${task.tone}`} aria-hidden="true">{task.initials}</span>
          <div className="task-text">
            <strong>{task.title}</strong>
            <small>{task.detail}</small>
          </div>
          <TonePill tone={task.tone}>{task.status_label}</TonePill>
          {withAction && <Link href={KIND_ROUTES[task.kind] ?? "/actions"} className="task-action">{task.action_label} →</Link>}
        </li>
      ))}
    </ul>
  );
}
