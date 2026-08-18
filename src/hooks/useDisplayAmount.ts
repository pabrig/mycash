"use client";

import { useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatDisplay } from "@/lib/format";

export function useDisplayAmount() {
  const { displayCurrency, rate } = useFinance();

  return useCallback(
    (amountArs: number) =>
      formatDisplay(amountArs, displayCurrency, rate.usdToArs),
    [displayCurrency, rate.usdToArs],
  );
}
