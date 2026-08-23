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
import { movementsForPersonalBalance } from "@/lib/movement-access";
import { resolveSharedHouseholdId } from "@/lib/household";
import { fetchLiveRatesClient } from "@/lib/rates-client";
import { friendlyError } from "@/lib/errors";
import { useBrowserSupabase } from "@/hooks/useBrowserSupabase";
import { useIsClient } from "@/hooks/useIsClient";
import { settingsForMoneyProfile, type MoneyProfile } from "@/lib/money-profile";
import { resolveOnboardingCompleted } from "@/lib/account-setup";
import {
  deleteMovementById,
  fetchAllMovementsForUser,
  fetchRates,
  fetchUserSettings,
  insertMovement,
  migrateLocalIfEmpty,
  saveAccountSetupRemote,
  saveDisplayCurrencyRemote,
  saveSharedEnabledRemote,
  saveSharedFundingRemote,
  saveUsdEnabledRemote,
  saveWalletModeRemote,
  updateMovementById,
  upsertRate,
} from "@/lib/supabase/data";
import type {
  AnnualSummary,
  DisplayCurrency,
  MonthlyRate,
  MonthlySummary,
  Movement,
  SplitAnnualSummary,
  SplitMonthlySummary,
  SharedFunding,
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
  /** Movimientos propios para la lista (el shared del otro no aparece acá) */
  ownMovements: Movement[];
  /** Movimientos que entran en tu mes (en pool, el shared se parte) */
  balanceMovements: Movement[];
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
  sharedFunding: SharedFunding;
  setSharedFunding: (funding: SharedFunding) => void;
  usdEnabled: boolean;
  setUsdEnabled: (enabled: boolean) => void;
  onboardingCompleted: boolean;
  replayOnboarding: () => void;
  completeAccountSetup: (input: {
    profile: MoneyProfile;
    walletMode: WalletMode;
    sharedEnabled: boolean;
    sharedFunding: SharedFunding;
  }) => Promise<void>;
  amountsHidden: boolean;
  setAmountsHidden: (hidden: boolean) => void;
  setPeriod: (year: number, month: number) => void;
  addMovement: (
    movement: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  ) => Promise<void>;
  addMovements: (
    movements: Omit<
      Movement,
      "id" | "createdAt" | "createdByUserId" | "createdByName"
    >[],
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
  const { configured, loading: authLoading, user, household, isAuthenticated, householdMemberCounts } =
    useAuth();

  const [ready, setReady] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [rates, setRates] = useState<MonthlyRate[]>([]);
  const [displayCurrency, setDisplayCurrencyState] =
    useState<DisplayCurrency>("ARS");
  const [walletMode, setWalletModeState] = useState<WalletMode>("unified");
  const [sharedEnabled, setSharedEnabledState] = useState(false);
  const [sharedFunding, setSharedFundingState] =
    useState<SharedFunding>("payer");
  const [usdEnabled, setUsdEnabledState] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
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
    setSharedFundingState(storage.loadSharedFunding());
    setUsdEnabledState(storage.loadUsdEnabled());
    setOnboardingCompleted(!storage.loadOnboardingReplay());
    setAmountsHiddenState(storage.loadAmountsHidden());
  }, []);

  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;

    await migrateLocalIfEmpty(supabase, user.id, storage.loadLocalSnapshot());

    const [remoteMovements, remoteRates, remoteSettings] = await Promise.all([
      fetchAllMovementsForUser(supabase),
      fetchRates(supabase, user.id),
      fetchUserSettings(supabase, user.id),
    ]);

    setMovements(remoteMovements);
    setRates(remoteRates);
    setDisplayCurrencyState(remoteSettings.displayCurrency);
    setWalletModeState(remoteSettings.walletMode);
    setSharedEnabledState(remoteSettings.sharedEnabled);
    setSharedFundingState(remoteSettings.sharedFunding);
    setUsdEnabledState(remoteSettings.usdEnabled);
    setOnboardingCompleted(
      resolveOnboardingCompleted({
        tracked: remoteSettings.onboardingTracked,
        completed: remoteSettings.onboardingCompleted,
        replay: storage.loadOnboardingReplay(),
      }),
    );
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
        setSharedFundingState("payer");
        setUsdEnabledState(true);
        setOnboardingCompleted(true);
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

  const setSharedFunding = useCallback(
    async (funding: SharedFunding) => {
      setSharedFundingState(funding);
      if (cloudEnabled && supabase && user) {
        await saveSharedFundingRemote(supabase, user.id, funding);
      } else {
        storage.saveSharedFunding(funding);
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
      await persistWalletMode(mode);
    },
    [persistWalletMode],
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
      }
    },
    [cloudEnabled, supabase, user, persistDisplayCurrency],
  );

  const completeAccountSetup = useCallback(
    async (input: {
      profile: MoneyProfile;
      walletMode: WalletMode;
      sharedEnabled: boolean;
      sharedFunding: SharedFunding;
    }) => {
      const settings = settingsForMoneyProfile(input.profile, input.walletMode);
      const displayCurrency: DisplayCurrency = "ARS";
      const sharedFunding = input.sharedEnabled ? input.sharedFunding : "payer";

      if (cloudEnabled && supabase && user) {
        await saveAccountSetupRemote(supabase, user.id, {
          displayCurrency,
          walletMode: settings.walletMode,
          sharedEnabled: input.sharedEnabled,
          sharedFunding,
          usdEnabled: settings.usdEnabled,
          onboardingCompleted: true,
        });
      } else {
        storage.saveUsdEnabled(settings.usdEnabled);
        storage.saveWalletMode(settings.walletMode);
        storage.saveSharedEnabled(input.sharedEnabled);
        storage.saveSharedFunding(sharedFunding);
        storage.saveDisplayCurrency(displayCurrency);
      }

      setUsdEnabledState(settings.usdEnabled);
      setWalletModeState(settings.walletMode);
      setSharedEnabledState(input.sharedEnabled);
      setSharedFundingState(sharedFunding);
      setDisplayCurrencyState(displayCurrency);
      setOnboardingCompleted(true);
      storage.saveOnboardingReplay(false);
    },
    [cloudEnabled, supabase, user],
  );

  const replayOnboarding = useCallback(() => {
    storage.saveOnboardingReplay(true);
    setOnboardingCompleted(false);
  }, []);

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

  const addMovements = useCallback(
    async (
      inputs: Omit<
        Movement,
        "id" | "createdAt" | "createdByUserId" | "createdByName"
      >[],
    ) => {
      if (inputs.length === 0) return;

      if (cloudEnabled && supabase && user) {
        const created = await Promise.all(
          inputs.map((input) => {
            const householdId = resolveSharedHouseholdId(
              input.scope,
              input.householdId,
              household?.id ?? null,
            );
            if (input.scope === "shared" && !householdId) {
              throw new Error("Elegí un grupo para este gasto.");
            }
            return insertMovement(supabase, input, user.id, householdId);
          }),
        );
        setMovements((prev) => [...created, ...prev]);
        return;
      }

      const now = new Date().toISOString();
      const created: Movement[] = inputs.map((input) => ({
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
      }));
      setMovements((prev) => {
        const next = [...created, ...prev];
        storage.saveMovements(next);
        return next;
      });
    },
    [cloudEnabled, supabase, user, household],
  );

  const addMovement = useCallback(
    async (
      input: Omit<
        Movement,
        "id" | "createdAt" | "createdByUserId" | "createdByName"
      >,
    ) => {
      await addMovements([input]);
    },
    [addMovements],
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
                description: "Saqué de diario",
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
                description: "Pasé a diario",
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
        const householdId = resolveSharedHouseholdId(
          input.scope,
          input.householdId,
          household?.id ?? null,
        );
        if (input.scope === "shared" && !householdId) {
          throw new Error("Elegí un grupo para este gasto.");
        }
        const updated = await updateMovementById(
          supabase,
          id,
          input,
          user.id,
          householdId,
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
    () =>
      movementsForPersonalBalance(
        movements,
        user?.id,
        "payer",
        householdMemberCounts,
      ),
    [movements, user?.id, householdMemberCounts],
  );

  const balanceMovements = useMemo(
    () =>
      movementsForPersonalBalance(
        movements,
        user?.id,
        sharedFunding,
        householdMemberCounts,
      ),
    [movements, user?.id, sharedFunding, householdMemberCounts],
  );

  const monthMovements = useMemo(
    () => filterByMonth(ownMovements, year, month),
    [ownMovements, year, month],
  );

  const monthBalanceMovements = useMemo(
    () => filterByMonth(balanceMovements, year, month),
    [balanceMovements, year, month],
  );

  const sharedMovements = useMemo(
    () => movements.filter((m) => m.scope === "shared"),
    [movements],
  );

  const summary = useMemo(
    () => computeMonthlySummary(monthBalanceMovements, rate),
    [monthBalanceMovements, rate],
  );

  const annualSummary = useMemo(
    () => computeAnnualSummary(balanceMovements, year, rates),
    [balanceMovements, year, rates],
  );

  const annualSummaryArs = useMemo(
    () => computeAnnualSummaryArs(balanceMovements, year, rates),
    [balanceMovements, year, rates],
  );

  const splitSummary = useMemo(
    () => computeSplitMonthlySummary(monthBalanceMovements, rate),
    [monthBalanceMovements, rate],
  );

  const splitAnnualSummary = useMemo(
    () => computeSplitAnnualSummary(balanceMovements, year, rates),
    [balanceMovements, year, rates],
  );

  const effectiveWalletMode: WalletMode =
    walletMode === "split" ? "split" : "unified";
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
      balanceMovements,
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
      sharedFunding,
      setSharedFunding,
      usdEnabled,
      setUsdEnabled,
      onboardingCompleted,
      replayOnboarding,
      completeAccountSetup,
      amountsHidden,
      setAmountsHidden,
      setPeriod,
      addMovement,
      addMovements,
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
      balanceMovements,
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
      sharedFunding,
      setSharedFunding,
      usdEnabled,
      setUsdEnabled,
      onboardingCompleted,
      replayOnboarding,
      completeAccountSetup,
      amountsHidden,
      setAmountsHidden,
      setPeriod,
      addMovement,
      addMovements,
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
