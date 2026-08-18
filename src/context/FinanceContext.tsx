"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getRateForMonth } from "@/lib/storage";
import {
  computeAnnualSummary,
  computeMonthlySummary,
  filterByMonth,
} from "@/lib/summary";
import {
  computeSplitAnnualSummary,
  computeSplitMonthlySummary,
} from "@/lib/wallet";
import { currentPeriod, isCurrentPeriod } from "@/lib/format";
import { fetchLiveRatesClient } from "@/lib/rates-client";
import { createClient } from "@/lib/supabase/client";
import {
  deleteMovementById,
  fetchAllMovementsForUser,
  fetchDisplayCurrency,
  fetchRates,
  fetchWalletMode,
  insertMovement,
  migrateLocalMovements,
  saveDisplayCurrencyRemote,
  saveSharedEnabledRemote,
  saveWalletModeRemote,
  updateMovementById,
  upsertRate,
  fetchSharedEnabled,
} from "@/lib/supabase/data";
import type {
  AnnualSummary,
  DisplayCurrency,
  MonthlyRate,
  MonthlySummary,
  Movement,
  SplitAnnualSummary,
  SplitMonthlySummary,
  WalletMode,
} from "@/lib/types";
import * as storage from "@/lib/storage";

interface FinanceContextValue {
  ready: boolean;
  cloudEnabled: boolean;
  movements: Movement[];
  sharedMovements: Movement[];
  rates: MonthlyRate[];
  year: number;
  month: number;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  walletMode: WalletMode;
  setWalletMode: (mode: WalletMode) => void;
  sharedEnabled: boolean;
  setSharedEnabled: (enabled: boolean) => void;
  setPeriod: (year: number, month: number) => void;
  addMovement: (
    movement: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  ) => Promise<void>;
  updateMovement: (
    id: string,
    movement: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  ) => Promise<void>;
  addConversion: (input: {
    direction: "to_usd" | "to_ars";
    amount: number;
    date: string;
  }) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  getMovementById: (id: string) => Movement | undefined;
  monthMovements: Movement[];
  summary: MonthlySummary;
  splitSummary: SplitMonthlySummary;
  annualSummary: AnnualSummary;
  splitAnnualSummary: SplitAnnualSummary;
  rate: MonthlyRate;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { configured, loading: authLoading, user, household, isAuthenticated } =
    useAuth();

  const [ready, setReady] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [rates, setRates] = useState<MonthlyRate[]>([]);
  const [displayCurrency, setDisplayCurrencyState] =
    useState<DisplayCurrency>("ARS");
  const [walletMode, setWalletModeState] = useState<WalletMode>("unified");
  const [sharedEnabled, setSharedEnabledState] = useState(false);
  const [period, setPeriodState] = useState({ year: 0, month: 0 });

  const cloudEnabled = configured && isAuthenticated;
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createClient
  > | null>(null);

  useEffect(() => {
    if (configured) setSupabase(createClient());
  }, [configured]);

  const loadLocal = useCallback(() => {
    setMovements(storage.loadMovements());
    setRates(storage.loadRates());
    setDisplayCurrencyState(storage.loadDisplayCurrency());
    setWalletModeState(storage.loadWalletMode());
    setSharedEnabledState(storage.loadSharedEnabled());
  }, []);

  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;

    await migrateLocalMovements(supabase, user.id, storage.loadMovements());

    const [
      remoteMovements,
      remoteRates,
      remoteDisplay,
      remoteWalletMode,
      remoteShared,
    ] = await Promise.all([
      fetchAllMovementsForUser(supabase),
      fetchRates(supabase, user.id),
      fetchDisplayCurrency(supabase, user.id),
      fetchWalletMode(supabase, user.id),
      fetchSharedEnabled(supabase, user.id),
    ]);

    setMovements(remoteMovements);
    setRates(remoteRates);
    setDisplayCurrencyState(remoteDisplay);
    setWalletModeState(remoteWalletMode);
    setSharedEnabledState(remoteShared);
  }, [supabase, user]);

  const refreshData = useCallback(async () => {
    if (cloudEnabled) {
      try {
        await loadCloud();
      } catch {
        loadLocal();
      }
    } else {
      loadLocal();
    }
  }, [cloudEnabled, loadCloud, loadLocal]);

  // Carga local inmediata (no depende de auth) para no quedar en "Cargando…"
  // si hay remount por hydration o auth lento.
  useEffect(() => {
    setPeriodState(currentPeriod());
    loadLocal();
    setReady(true);
  }, [loadLocal]);

  // Upgrade a nube cuando la sesión esté lista
  useEffect(() => {
    if (authLoading || !cloudEnabled) return;

    let cancelled = false;
    void (async () => {
      try {
        await loadCloud();
      } catch {
        if (!cancelled) loadLocal();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, cloudEnabled, loadCloud, loadLocal]);

  const { year, month } = period;

  const setDisplayCurrency = useCallback(
    async (currency: DisplayCurrency) => {
      setDisplayCurrencyState(currency);
      if (cloudEnabled && supabase && user) {
        await saveDisplayCurrencyRemote(supabase, user.id, currency);
      } else {
        storage.saveDisplayCurrency(currency);
      }
    },
    [cloudEnabled, supabase, user],
  );

  const setWalletMode = useCallback(
    async (mode: WalletMode) => {
      setWalletModeState(mode);
      if (cloudEnabled && supabase && user) {
        await saveWalletModeRemote(supabase, user.id, mode);
      } else {
        storage.saveWalletMode(mode);
      }
    },
    [cloudEnabled, supabase, user],
  );

  const setSharedEnabled = useCallback(
    async (enabled: boolean) => {
      setSharedEnabledState(enabled);
      if (cloudEnabled && supabase && user) {
        await saveSharedEnabledRemote(supabase, user.id, enabled);
      } else {
        storage.saveSharedEnabled(enabled);
      }
    },
    [cloudEnabled, supabase, user],
  );

  const setPeriod = useCallback((y: number, m: number) => {
    setPeriodState({ year: y, month: m });
  }, []);

  const saveRate = useCallback(
    async (rate: MonthlyRate) => {
      setRates((prev) => {
        const next = prev.filter(
          (r) => !(r.year === rate.year && r.month === rate.month),
        );
        next.push(rate);
        if (!cloudEnabled) storage.saveRates(next);
        return next;
      });

      if (cloudEnabled && supabase && user) {
        await upsertRate(supabase, user.id, rate);
      }
    },
    [cloudEnabled, supabase, user],
  );

  useEffect(() => {
    if (!ready || !isCurrentPeriod(year, month)) return;

    void fetchLiveRatesClient()
      .then((live) => {
        void saveRate({
          year,
          month,
          usdToArs: live.usdToArs,
          updatedAt: live.updatedAt,
        });
      })
      .catch(() => {});
  }, [ready, year, month, saveRate]);

  const addMovement = useCallback(
    async (
      input: Omit<
        Movement,
        "id" | "createdAt" | "createdByUserId" | "createdByName"
      >,
    ) => {
      if (cloudEnabled && supabase && user) {
        const created = await insertMovement(
          supabase,
          input,
          user.id,
          input.scope === "shared" ? (household?.id ?? null) : null,
        );
        setMovements((prev) => [created, ...prev]);
        return;
      }

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
    [cloudEnabled, supabase, user, household],
  );

  const addConversion = useCallback(
    async (input: {
      direction: "to_usd" | "to_ars";
      amount: number;
      date: string;
    }) => {
      const currentRate = getRateForMonth(rates, year, month);
      if (currentRate.usdToArs <= 0) {
        throw new Error("Tipo de cambio no disponible");
      }

      const pair =
        input.direction === "to_usd"
          ? {
              out: {
                type: "expense" as const,
                amount: input.amount,
                currency: "ARS" as const,
                description: "Conversión a Ahorro USD",
                scope: "personal" as const,
                kind: "variable" as const,
                category: "extras",
                wallet: "vida" as const,
                date: input.date,
              },
              into: {
                type: "income" as const,
                amount: input.amount / currentRate.usdToArs,
                currency: "USD" as const,
                description: "Conversión desde Cotidiano",
                incomeKind: "active" as const,
                source: "otros",
                wallet: "ahorro" as const,
                date: input.date,
              },
            }
          : {
              out: {
                type: "expense" as const,
                amount: input.amount,
                currency: "USD" as const,
                description: "Venta de USD a Cotidiano",
                scope: "personal" as const,
                kind: "variable" as const,
                category: "extras",
                wallet: "ahorro" as const,
                date: input.date,
              },
              into: {
                type: "income" as const,
                amount: input.amount * currentRate.usdToArs,
                currency: "ARS" as const,
                description: "Conversión desde Ahorro USD",
                incomeKind: "active" as const,
                source: "otros",
                wallet: "vida" as const,
                date: input.date,
              },
            };

      // Dos movimientos: sale de un bolsillo y entra al otro
      await addMovement(pair.out);
      await addMovement(pair.into);
    },
    [rates, year, month, addMovement],
  );

  const deleteMovement = useCallback(
    async (id: string) => {
      if (cloudEnabled && supabase) {
        await deleteMovementById(supabase, id);
      }
      setMovements((prev) => {
        const next = prev.filter((m) => m.id !== id);
        if (!cloudEnabled) storage.saveMovements(next);
        return next;
      });
    },
    [cloudEnabled, supabase],
  );

  const updateMovement = useCallback(
    async (
      id: string,
      input: Omit<
        Movement,
        "id" | "createdAt" | "createdByUserId" | "createdByName"
      >,
    ) => {
      if (cloudEnabled && supabase && user) {
        const updated = await updateMovementById(
          supabase,
          id,
          input,
          user.id,
          input.scope === "shared" ? (household?.id ?? null) : null,
        );
        setMovements((prev) => prev.map((m) => (m.id === id ? updated : m)));
        return;
      }

      setMovements((prev) => {
        const next = prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...input,
              }
            : m,
        );
        storage.saveMovements(next);
        return next;
      });
    },
    [cloudEnabled, supabase, user, household],
  );

  const getMovementById = useCallback(
    (id: string) => movements.find((m) => m.id === id),
    [movements],
  );

  const rate = useMemo(
    () => getRateForMonth(rates, year, month),
    [rates, year, month],
  );

  const monthMovements = useMemo(
    () => filterByMonth(movements, year, month),
    [movements, year, month],
  );

  const sharedMovements = useMemo(
    () => movements.filter((m) => m.scope === "shared"),
    [movements],
  );

  const summary = useMemo(
    () => computeMonthlySummary(monthMovements, rate),
    [monthMovements, rate],
  );

  const annualSummary = useMemo(
    () => computeAnnualSummary(movements, year, rates),
    [movements, year, rates],
  );

  const splitSummary = useMemo(
    () => computeSplitMonthlySummary(monthMovements, rate),
    [monthMovements, rate],
  );

  const splitAnnualSummary = useMemo(
    () => computeSplitAnnualSummary(movements, year, rates),
    [movements, year, rates],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      cloudEnabled,
      movements,
      sharedMovements,
      rates,
      year,
      month,
      displayCurrency,
      setDisplayCurrency,
      walletMode,
      setWalletMode,
      sharedEnabled,
      setSharedEnabled,
      setPeriod,
      addMovement,
      updateMovement,
      addConversion,
      deleteMovement,
      getMovementById,
      monthMovements,
      summary,
      splitSummary,
      annualSummary,
      splitAnnualSummary,
      rate,
      refreshData,
    }),
    [
      ready,
      cloudEnabled,
      movements,
      sharedMovements,
      rates,
      year,
      month,
      displayCurrency,
      setDisplayCurrency,
      walletMode,
      setWalletMode,
      sharedEnabled,
      setSharedEnabled,
      setPeriod,
      addMovement,
      updateMovement,
      addConversion,
      deleteMovement,
      getMovementById,
      monthMovements,
      summary,
      splitSummary,
      annualSummary,
      splitAnnualSummary,
      rate,
      refreshData,
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
