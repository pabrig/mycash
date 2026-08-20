"use client";

import { useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  formatDisplay,
  formatMoney,
  formatUsd,
  formatUsdShort,
  HIDDEN_AMOUNT_ARS,
  HIDDEN_AMOUNT_USD,
  HIDDEN_AMOUNT_SHORT,
} from "@/lib/format";

export function useDisplayAmount() {
  const { displayCurrency, rate, amountsHidden } = useFinance();

  return useCallback(
    (amountArs: number) =>
      amountsHidden
        ? displayCurrency === "USD"
          ? HIDDEN_AMOUNT_USD
          : HIDDEN_AMOUNT_ARS
        : formatDisplay(amountArs, displayCurrency, rate.usdToArs),
    [amountsHidden, displayCurrency, rate.usdToArs],
  );
}

export function useFormatMoney() {
  const { amountsHidden } = useFinance();
  return useCallback(
    (amount: number) => (amountsHidden ? HIDDEN_AMOUNT_ARS : formatMoney(amount)),
    [amountsHidden],
  );
}

export function useFormatUsd() {
  const { amountsHidden } = useFinance();
  return useCallback(
    (amount: number) => (amountsHidden ? HIDDEN_AMOUNT_USD : formatUsd(amount)),
    [amountsHidden],
  );
}

export function useFormatUsdShort() {
  const { amountsHidden } = useFinance();
  return useCallback(
    (amount: number) =>
      amountsHidden ? HIDDEN_AMOUNT_SHORT : formatUsdShort(amount),
    [amountsHidden],
  );
}
