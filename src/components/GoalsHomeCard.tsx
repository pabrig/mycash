"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { GoalEditor } from "@/components/GoalEditor";
import { IconChevronDown } from "@/components/ui/Icons";
import {
  activeGoals,
  completedGoals,
  goalProgressPercent,
  isGoalComplete,
  normalizeGoalPlace,
  type SavingsGoal,
} from "@/lib/goals";
import {
  goalPlaceLabel,
  goalProgressCopy,
  goalsHomeCopy,
  goalsReservedCopy,
} from "@/lib/goals-copy";
import { useFormatMoney } from "@/hooks/useDisplayAmount";
import { formatMoney, formatUsd } from "@/lib/format";
import { isFeatureEnabled } from "@/lib/feature-flags";

function formatGoalMoney(goal: SavingsGoal): (n: number) => string {
  return (n) => (goal.currency === "USD" ? formatUsd(n) : formatMoney(n));
}

export function GoalsHomeCard() {
  const {
    goalsEnabled,
    savingsGoals,
    goalsReservedArs,
    monthBalance,
    splitMonthBalance,
    walletMode,
  } = useFinance();
  const formatArs = useFormatMoney();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<"contribute" | "edit">(
    "contribute",
  );

  if (!isFeatureEnabled("savingsGoals") || !goalsEnabled) return null;

  const active = activeGoals(savingsGoals);
  const done = completedGoals(savingsGoals);
  const hasGoals = active.length + done.length > 0;
  const copy = goalsHomeCopy(hasGoals);
  const isSplit = walletMode === "split";
  const baseDisponible = isSplit
    ? splitMonthBalance.vida.totalDisponible
    : monthBalance.totalDisponible;
  const freeArs = baseDisponible - goalsReservedArs;
  const reserved = goalsReservedCopy(
    goalsReservedArs,
    freeArs,
    formatArs,
    { split: isSplit },
  );
  const activeGoal = activeId
    ? savingsGoals.find((g) => g.id === activeId) ?? null
    : null;

  const summaryLine = !hasGoals
    ? copy.emptyTitle
    : reserved
      ? reserved.free
      : active.length === 1
        ? active[0].name
        : `${active.length} activas${done.length ? ` · ${done.length} hechas` : ""}`;

  function openGoal(id: string, complete: boolean) {
    setActiveId(id);
    setSheetMode(complete ? "edit" : "contribute");
  }

  return (
    <>
      <section className="bento overflow-hidden !p-0">
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                {copy.title}
                {hasGoals ? (
                  <span className="ml-1.5 font-normal text-zinc-400">
                    · {active.length + done.length}
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {summaryLine}
              </p>
            </div>
            <IconChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 border-l border-zinc-100 px-4 text-xs font-semibold text-teal-700 dark:border-zinc-800 dark:text-teal-400"
          >
            {copy.add}
          </button>
        </div>

        {open ? (
          <div className="space-y-3 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
            {reserved ? (
              <p className="text-[11px] leading-snug text-zinc-400">
                {reserved.reserved}. {reserved.hint}
              </p>
            ) : null}

            {!hasGoals ? (
              <div className="py-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {copy.emptyBody}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {active.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {active.map((goal) => (
                      <GoalRow
                        key={goal.id}
                        goal={goal}
                        walletMode={walletMode}
                        onOpen={() => openGoal(goal.id, false)}
                      />
                    ))}
                  </ul>
                ) : null}

                {done.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      {copy.doneSection}
                    </p>
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {done.map((goal) => (
                        <GoalRow
                          key={goal.id}
                          goal={goal}
                          walletMode={walletMode}
                          onOpen={() => openGoal(goal.id, true)}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {creating ? (
        <DetailSheet
          open
          onClose={() => setCreating(false)}
          title="Nueva meta"
        >
          <GoalEditor
            mode="create"
            onDone={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </DetailSheet>
      ) : null}

      {activeGoal ? (
        <DetailSheet
          open
          onClose={() => setActiveId(null)}
          title={
            sheetMode === "contribute" ? `Apartar · ${activeGoal.name}` : activeGoal.name
          }
        >
          <GoalEditor
            goal={activeGoal}
            mode={sheetMode}
            onDone={() => setActiveId(null)}
            onCancel={() => setActiveId(null)}
            onEditRequest={
              sheetMode === "contribute"
                ? () => setSheetMode("edit")
                : undefined
            }
          />
        </DetailSheet>
      ) : null}
    </>
  );
}

function GoalRow({
  goal,
  walletMode,
  onOpen,
}: {
  goal: SavingsGoal;
  walletMode: "unified" | "split";
  onOpen: () => void;
}) {
  const progress = goalProgressPercent(goal);
  const copy = goalProgressCopy(goal);
  const done = isGoalComplete(goal);
  const fmt = formatGoalMoney(goal);
  const barWidth = done ? 100 : Math.max(progress, progress > 0 ? 4 : 0);
  const place = normalizeGoalPlace(goal.place, walletMode);
  const showPlace = walletMode === "split";

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full py-3 text-left transition first:pt-0 last:pb-0 active:opacity-80"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {goal.name}
            {showPlace ? (
              <span className="ml-1.5 font-normal text-zinc-400">
                · {goalPlaceLabel(place)}
              </span>
            ) : null}
          </p>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
            {done ? copy.status : fmt(goal.savedAmount)}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">
          {done ? copy.detail : `${copy.status} · ${copy.detail}`}
        </p>
        {!done ? (
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        ) : null}
        {!done && copy.planModeLabel ? (
          <p className="mt-1.5 text-[11px] text-zinc-400">
            {copy.planModeLabel}
            {copy.plan ? ` · ${copy.plan}` : ""}
          </p>
        ) : !done && copy.plan ? (
          <p className="mt-1.5 text-[11px] text-zinc-400">{copy.plan}</p>
        ) : null}
      </button>
    </li>
  );
}
