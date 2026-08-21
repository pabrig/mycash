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
  computeAnnualSummaryArs,
  computeMonthlySummary,
  filterByMonth,
} from "@/lib/summary";
import {
  computeSplitAnnualSummary,
  computeSplitMonthlySummary,
} from "@/lib/wallet";
import { currentPeriod, isCurrentPeriod } from "@/lib/format";
import { affectsUserBalance } from "@/lib/movement-access";
import { fetchLiveRatesClient } from "@/lib/rates-client";
import { friendlyError } from "@/lib/errors";
import { useBrowserSupabase } from "@/hooks/useBrowserSupabase";
import { useIsClient } from "@/hooks/useIsClient";
import {
  deleteMovementById,
  fetchAllMovementsForUser,
  fetchDisplayCurrency,
  fetchRates,
  fetchWalletMode,
  insertMovement,
  migrateLocalIfEmpty,
  saveDisplayCurrencyRemote,
  saveSharedEnabledRemote,
  saveUsdEnabledRemote,
  saveWalletModeRemote,
  updateMovementById,
  upsertRate,
  fetchSharedEnabled,
  fetchUsdEnabled,
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
  /** Error de sync/red visible; null si ok */
  syncError: string | null;
  clearSyncError: () => void;
  movements: Movement[];
  /** Movimientos que entran en el disponible (sin lo compartido del otro) */
  ownMovements: Movement[];
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
  usdEnabled: boolean;
  setUsdEnabled: (enabled: boolean) => void;
  amountsHidden: boolean;
  setAmountsHidden: (hidden: boolean) => void;
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
  annualSummaryArs: AnnualSummary;
  splitAnnualSummary: SplitAnnualSummary;
  rate: MonthlyRate;
  refreshData: () => Promise<void>;
}

function friendlySyncError(e: unknown): string {
  return friendlyError(e, "No se pudo guardar en la nube.", {
    offline: "Sin conexión. Estamos mostrando lo de este celular.",
  });
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
  const [usdEnabled, setUsdEnabledState] = useState(true);
  const [amountsHidden, setAmountsHiddenState] = useState(false);
  const [period, setPeriodState] = useState({ year: 0, month: 0 });

  const cloudEnabled = configured && isAuthenticated;
  const [syncError, setSyncError] = useState<string | null>(null);
  const supabase = useBrowserSupabase();
  const isClient = useIsClient();

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const loadLocal = useCallback(() => {
    setMovements(storage.loadMovements());
    setRates(storage.loadRates());
    setDisplayCurrencyState(storage.loadDisplayCurrency());
    setWalletModeState(storage.loadWalletMode());
    setSharedEnabledState(storage.loadSharedEnabled());
    setUsdEnabledState(storage.loadUsdEnabled());
    setAmountsHiddenState(storage.loadAmountsHidden());
  }, []);

  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;

    await migrateLocalIfEmpty(supabase, user.id, storage.loadLocalSnapshot());

    const [
      remoteMovements,
      remoteRates,
      remoteDisplay,
      remoteWalletMode,
      remoteShared,
      remoteUsd,
    ] = await Promise.all([
      fetchAllMovementsForUser(supabase),
      fetchRates(supabase, user.id),
      fetchDisplayCurrency(supabase, user.id),
      fetchWalletMode(supabase, user.id),
      fetchSharedEnabled(supabase, user.id),
      fetchUsdEnabled(supabase, user.id),
    ]);

    setMovements(remoteMovements);
    setRates(remoteRates);
    setDisplayCurrencyState(remoteDisplay);
    setWalletModeState(remoteWalletMode);
    setSharedEnabledState(remoteShared);
    setUsdEnabledState(remoteUsd);
    storage.clearSyncedLocalFinance();
    setSyncError(null);
  }, [supabase, user]);

  const refreshData = useCallback(async () => {
    if (cloudEnabled) {
      try {
        await loadCloud();
      } catch (e) {
        setSyncError(friendlySyncError(e));
        loadLocal();
      }
    } else {
      setSyncError(null);
      loadLocal();
    }
  }, [cloudEnabled, loadCloud, loadLocal]);

  // Esperar sesión y cargar nube antes de pintar. Sin eso, un dispositivo
  // nuevo muestra localStorage vacío como si se hubiera perdido la cuenta.
  useEffect(() => {
    if (!isClient || authLoading) return;

    let cancelled = false;

    void (async () => {
      setPeriodState((prev) => (prev.year === 0 ? currentPeriod() : prev));
      setAmountsHiddenState(storage.loadAmountsHidden());

      if (configured && !isAuthenticated) {
        setMovements([]);
        setRates([]);
        setDisplayCurrencyState("ARS");
        setWalletModeState("unified");
        setSharedEnabledState(false);
        setUsdEnabledState(true);
        if (!cancelled) setReady(true);
        return;
      }

      try {
        if (cloudEnabled) {
          await loadCloud();
        } else {
          setSyncError(null);
          loadLocal();
        }
      } catch (e) {
        if (!cancelled) {
          setSyncError(friendlySyncError(e));
          loadLocal();
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isClient,
    authLoading,
    configured,
    isAuthenticated,
    cloudEnabled,
    loadCloud,
    loadLocal,
  ]);

  const { year, month } = period;

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

  const persistDisplayCurrency = useCallback(
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

  const persistWalletMode = useCallback(
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

  const setDisplayCurrency = useCallback(
    async (currency: DisplayCurrency) => {
      if (currency === "USD" && !usdEnabled) return;
      await persistDisplayCurrency(currency);
    },
    [usdEnabled, persistDisplayCurrency],
  );

  const setWalletMode = useCallback(
    async (mode: WalletMode) => {
      if (mode === "split" && !usdEnabled) return;
      await persistWalletMode(mode);
    },
    [usdEnabled, persistWalletMode],
  );

  const setUsdEnabled = useCallback(
    async (enabled: boolean) => {
      setUsdEnabledState(enabled);
      if (cloudEnabled && supabase && user) {
        await saveUsdEnabledRemote(supabase, user.id, enabled);
      } else {
        storage.saveUsdEnabled(enabled);
      }
      if (!enabled) {
        await persistDisplayCurrency("ARS");
        await persistWalletMode("unified");
      }
    },
    [cloudEnabled, supabase, user, persistDisplayCurrency, persistWalletMode],
  );

  const setAmountsHidden = useCallback((hidden: boolean) => {
    setAmountsHiddenState(hidden);
    storage.saveAmountsHidden(hidden);
  }, []);

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
        throw new Error("No hay cotización ahora");
      }

      const pair =
        input.direction === "to_usd"
          ? {
              out: {
                type: "expense" as const,
                amount: input.amount,
                currency: "ARS" as const,
                description: "Pasé a ahorro",
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
                description: "Saqué de cotidiano",
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
                description: "Pasé a cotidiano",
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
                description: "Saqué de ahorro",
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

  const ownMovements = useMemo(
    () => movements.filter((m) => affectsUserBalance(m, user?.id)),
    [movements, user?.id],
  );

  const monthMovements = useMemo(
    () => filterByMonth(ownMovements, year, month),
    [ownMovements, year, month],
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
    () => computeAnnualSummary(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const annualSummaryArs = useMemo(
    () => computeAnnualSummaryArs(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const splitSummary = useMemo(
    () => computeSplitMonthlySummary(monthMovements, rate),
    [monthMovements, rate],
  );

  const splitAnnualSummary = useMemo(
    () => computeSplitAnnualSummary(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const effectiveWalletMode: WalletMode =
    usdEnabled && walletMode === "split" ? "split" : "unified";
  const effectiveDisplayCurrency: DisplayCurrency =
    usdEnabled && displayCurrency === "USD" ? "USD" : "ARS";

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      cloudEnabled,
      syncError,
      clearSyncError,
      movements,
      ownMovements,
      sharedMovements,
      rates,
      year,
      month,
      displayCurrency: effectiveDisplayCurrency,
      setDisplayCurrency,
      walletMode: effectiveWalletMode,
      setWalletMode,
      sharedEnabled,
      setSharedEnabled,
      usdEnabled,
      setUsdEnabled,
      amountsHidden,
      setAmountsHidden,
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
      annualSummaryArs,
      splitAnnualSummary,
      rate,
      refreshData,
    }),
    [
      ready,
      cloudEnabled,
      syncError,
      clearSyncError,
      movements,
      ownMovements,
      sharedMovements,
      rates,
      year,
      month,
      effectiveDisplayCurrency,
      setDisplayCurrency,
      effectiveWalletMode,
      setWalletMode,
      sharedEnabled,
      setSharedEnabled,
      usdEnabled,
      setUsdEnabled,
      amountsHidden,
      setAmountsHidden,
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
      annualSummaryArs,
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
