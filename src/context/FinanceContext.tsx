"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getRateForMonth } from "@/lib/storage";
import {
  computeAnnualSummary,
  computeMonthlySummary,
  filterByMonth,
} from "@/lib/summary";
import { currentPeriod, isCurrentPeriod } from "@/lib/format";
import { fetchLiveRatesClient } from "@/lib/rates-client";
import type {
  AnnualSummary,
  DisplayCurrency,
  MonthlyRate,
  MonthlySummary,
  Movement,
} from "@/lib/types";
import * as storage from "@/lib/storage";

interface FinanceContextValue {
  ready: boolean;
  movements: Movement[];
  rates: MonthlyRate[];
  year: number;
  month: number;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  setPeriod: (year: number, month: number) => void;
  addMovement: (movement: Omit<Movement, "id" | "createdAt">) => void;
  deleteMovement: (id: string) => void;
  monthMovements: Movement[];
  summary: MonthlySummary;
  annualSummary: AnnualSummary;
  rate: MonthlyRate;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [rates, setRates] = useState<MonthlyRate[]>([]);
  const [displayCurrency, setDisplayCurrencyState] =
    useState<DisplayCurrency>("ARS");
  const [period, setPeriodState] = useState(currentPeriod);

  useLayoutEffect(() => {
    setMovements(storage.loadMovements());
    setRates(storage.loadRates());
    setDisplayCurrencyState(storage.loadDisplayCurrency());
    setReady(true);
  }, []);

  const { year, month } = period;

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    storage.saveDisplayCurrency(currency);
    setDisplayCurrencyState(currency);
  }, []);

  const setPeriod = useCallback((y: number, m: number) => {
    setPeriodState({ year: y, month: m });
  }, []);

  const saveRate = useCallback((rate: MonthlyRate) => {
    setRates((prev) => {
      const next = prev.filter(
        (r) => !(r.year === rate.year && r.month === rate.month),
      );
      next.push(rate);
      storage.saveRates(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!ready || !isCurrentPeriod(year, month)) return;

    void fetchLiveRatesClient()
      .then((live) => {
        saveRate({
          year,
          month,
          usdToArs: live.usdToArs,
          updatedAt: live.updatedAt,
        });
      })
      .catch(() => {
        // Silencioso — se usa la última cotización guardada o default
      });
  }, [ready, year, month, saveRate]);

  const addMovement = useCallback(
    (input: Omit<Movement, "id" | "createdAt">) => {
      const movement: Movement = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => {
        const next = [movement, ...prev];
        storage.saveMovements(next);
        return next;
      });
    },
    [],
  );

  const deleteMovement = useCallback((id: string) => {
    setMovements((prev) => {
      const next = prev.filter((m) => m.id !== id);
      storage.saveMovements(next);
      return next;
    });
  }, []);

  const rate = useMemo(
    () => getRateForMonth(rates, year, month),
    [rates, year, month],
  );

  const monthMovements = useMemo(
    () => filterByMonth(movements, year, month),
    [movements, year, month],
  );

  const summary = useMemo(
    () => computeMonthlySummary(monthMovements, rate),
    [monthMovements, rate],
  );

  const annualSummary = useMemo(
    () => computeAnnualSummary(movements, year, rates),
    [movements, year, rates],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      movements,
      rates,
      year,
      month,
      displayCurrency,
      setDisplayCurrency,
      setPeriod,
      addMovement,
      deleteMovement,
      monthMovements,
      summary,
      annualSummary,
      rate,
    }),
    [
      ready,
      movements,
      rates,
      year,
      month,
      displayCurrency,
      setDisplayCurrency,
      setPeriod,
      addMovement,
      deleteMovement,
      monthMovements,
      summary,
      annualSummary,
      rate,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
