import type { Currency, MonthlyRate } from "./types";

export function toArs(
  amount: number,
  currency: Currency,
  rate: MonthlyRate,
): number {
  if (currency === "USD") return amount * rate.usdToArs;
  return amount;
}

export function toUsd(
  amount: number,
  currency: Currency,
  rate: MonthlyRate,
): number {
  if (currency === "USD") return amount;
  if (rate.usdToArs <= 0) return 0;
  return amount / rate.usdToArs;
}

export function getDefaultRate(year: number, month: number): MonthlyRate {
  return {
    year,
    month,
    usdToArs: 1200,
  };
}
