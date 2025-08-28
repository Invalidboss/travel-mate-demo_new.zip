import React, { useMemo, useState } from "react";

// Simple, single-file React demo you can run right here.
// Features:
// - Add trips (destination, dates, purpose)
// - Add expenses per trip (category, amount, currency)
// - Mileage calculator (km * 0.30)
// - Per-diem helper for DE (14€/28€ with basic reductions)
// - Sort & filter
// - Export/Import JSON
// - All client-side; no backend

// Utilities
const currency = (n: number, c = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n);

const todayISO = () => new Date().toISOString().slice(0, 10);

// Types
interface Expense {
  id: string;
  tripId: string;
  date: string;
  category: "Hotel" | "Transport" | "Meal" | "Other";
  amount: number;
  currency: string;
  note?: string;
}

interface Trip {
  id: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  customer: string;
  project: string;
  mileageKm: number; // total km for the trip
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
}

interface AppState {
  trips: Trip[];
  expenses: Expense[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

function calcHours(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  return Math.max(0, (e.getTime() - s.getTime()) / 36e5);
}

function perDiemDE({ hours, meals }: { hours: number; meals: { b: boolean; l: boolean; d: boolean } }) {
  // Very simplified DE 2025 helper (demo):
  // ≥ 24h => 28€, 8–24h => 14€, <8h => 0€; reductions: B -20%, L -40%, D -40% of the *base*.
  const base = hours >= 24 ? 28 : hours >= 8 ? 14 : 0;
  const reduction = base * (meals.b ? 0.2 : 0) + base * (meals.l ? 0.4 : 0) + base * (meals.d ? 0.4 : 0);
  return Math.max(0, base - reduction);
}

function exportJson(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `travel-mate-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJson(onLoad: (s: AppState) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.trips) && Array.isArray(parsed.expenses)) onLoad(parsed);
        else alert("Invalid JSON shape.");
      } catch (e) {
        alert("Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl shadow p-4 bg-white ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: React.PropsWithChildren) {
  return <h2 className="text-xl font-semibold mb-2">{children}</h2>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-12 gap-3 items-center mb-2">
      <span className="col-span-4 md:col-span-3 text-sm text-gray-600">{label}</span>
      <span className="col-span-8 md:col-span-9">{children}</span>
    </label>
  );
}

const DemoSeed: AppState = {
  trips: [
    {
      id: uid(),
      origin: "Berlin",
      destination: "München",
      startDate: todayISO(),
      endDate: todayISO(),
      purpose: "Kundentermin",
      customer: "ACME GmbH",
      project: "Rollout",
      mileageKm: 580,
      includeBreakfast: false,
      includeLunch: true,
      includeDinner: false,
    },
  ],
  expenses: [
    {
      id: uid(),
      tripId: "seed", // will be remapped after mount
      date: todayISO(),
      category: "Transport",
      amount: 49.9,
      currency: "EUR",
      note: "ICE Ticket",
    },
  ],
};

export function matchesFilter(t: Trip, filter: string) {
  const q = filter.toLowerCase();
  return (
    t.destination.toLowerCase().includes(q) ||
    t.purpose.toLowerCase().includes(q) ||
    (t.customer ?? "").toLowerCase().includes(q) ||
    (t.project ?? "").toLowerCase().includes(q)
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const t = DemoSeed.trips[0];
    const newTripId = uid();
    const trips = [{ ...t, id: newTripId }];
    const expenses = DemoSeed.expenses.map((e) => ({ ...e, tripId: newTripId }));
    return { trips, expenses };
  });

  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<"start" | "dest">("start");

  const visibleTrips = useMemo(() => {
    const f = state.trips.filter((t) => matchesFilter(t, filter));
    return [...f].sort((a, b) =>
      sortKey === "start"
        ? a.startDate.localeCompare(b.startDate)
        : a.destination.localeCompare(b.destination)
    );
  }, [state.trips, filter, sortKey]);

  function addTrip() {
    const trip: Trip = {
      id: uid(),
      origin: "",
      destination: "",
      startDate: todayISO(),
      endDate: todayISO(),
      purpose: "",
      customer: "",
      project: "",
      mileageKm: 0,
      includeBreakfast: false,
      includeLunch: false,
      includeDinner: false,
    };
    setState((s) => ({ ...s, trips: [trip, ...s.trips] }));
  }

  function updateTrip(id: string, patch: Partial<Trip>) {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  function removeTrip(id: string) {
    setState((s) => ({
      trips: s.trips.filter((t) => t.id !== id),
      expenses: s.expenses.filter((e) => e.tripId !== id),
    }));
  }

  function addExpense(tripId: string) {
    const exp: Expense = {
      id: uid(),
      tripId,
      date: todayISO(),
      category: "Other",
      amount: 0,
      currency: "EUR",
      note: "",
    };
    setState((s) => ({ ...s, expenses: [exp, ...s.expenses] }));
  }

  function updateExpense(id: string, patch: Partial<Expense>) {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeExpense(id: string) {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }

  function totalForTrip(tripId: string) {
    const ex = state.expenses.filter((e) => e.tripId === tripId);
    const expSum = ex.reduce((a, b) => a + (isFinite(b.amount) ? b.amount : 0), 0);
    const trip = state.trips.find((t) => t.id === tripId)!;
    const hours = Math.max(0, calcHours(trip.startDate + "T08:00", trip.endDate + "T18:00"));
    const perDiem = perDiemDE({
      hours,
      meals: { b: trip.includeBreakfast, l: trip.includeLunch, d: trip.includeDinner },
    });
    const mileage = trip.mileageKm * 0.3; // EUR/km
    return { expSum, perDiem, mileage, total: expSum + perDiem + mileage };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Travel Mate — Demo</h1>
            <p className="text-sm text-gray-600 mt-1">Quick, testable prototype you can click & try.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90" onClick={() => addTrip()}>+ New Trip</button>
            <button className="px-3 py-2 rounded-xl bg-white border hover:bg-gray-50" onClick={() => exportJson(state)}>Export JSON</button>
            <button className="px-3 py-2 rounded-xl bg-white border hover:bg-gray-50" onClick={() => importJson((s) => setState(s))}>Import JSON</button>
          </div>
        </header>

        <Card className="mb-6">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="Filter by destination, purpose, customer or project"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select className="border rounded-xl px-3 py-2" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
              <option value="start">Sort by start date</option>
              <option value="dest">Sort by destination</option>
            </select>
            <div className="text-sm text-gray-500 flex items-center">{visibleTrips.length} trip(s)</div>
          </div>
        </Card>

        <div className="grid gap-4">
          {visibleTrips.map((t) => {
            const sums = totalForTrip(t.id);
            const ex = state.expenses.filter((e) => e.tripId === t.id);
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{t.origin || "(origin)"} → {t.destination || "(destination)"}</h3>
                    <p className="text-sm text-gray-500">{t.startDate} → {t.endDate} · {t.purpose || "(purpose)"} · {t.customer || "(customer)"} · {t.project || "(project)"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{currency(sums.total)}</div>
                    <div className="text-xs text-gray-500">Expenses {currency(sums.expSum)} · Per-diem {currency(sums.perDiem)} · Mileage {currency(sums.mileage)}</div>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  <div>
                    <SectionTitle>Trip details</SectionTitle>
                    <Row label="Origin">
                      <input className="w-full border rounded-xl px-3 py-2" value={t.origin} onChange={(e) => updateTrip(t.id, { origin: e.target.value })} />
                    </Row>
                    <Row label="Destination">
                      <input className="w-full border rounded-xl px-3 py-2" value={t.destination} onChange={(e) => updateTrip(t.id, { destination: e.target.value })} />
                    </Row>
                    <Row label="Start">
                      <input type="date" className="w-full border rounded-xl px-3 py-2" value={t.startDate} onChange={(e) => updateTrip(t.id, { startDate: e.target.value })} />
                    </Row>
                    <Row label="End">
                      <input type="date" className="w-full border rounded-xl px-3 py-2" value={t.endDate} onChange={(e) => updateTrip(t.id, { endDate: e.target.value })} />
                    </Row>
                    <Row label="Purpose">
                      <input className="w-full border rounded-xl px-3 py-2" value={t.purpose} onChange={(e) => updateTrip(t.id, { purpose: e.target.value })} />
                    </Row>
                    <Row label="Customer">
                      <input className="w-full border rounded-xl px-3 py-2" value={t.customer} onChange={(e) => updateTrip(t.id, { customer: e.target.value })} />
                    </Row>
                    <Row label="Project">
                      <input className="w-full border rounded-xl px-3 py-2" value={t.project} onChange={(e) => updateTrip(t.id, { project: e.target.value })} />
                    </Row>
                    <Row label="Mileage (km)">
                      <input type="number" min={0} className="w-full border rounded-xl px-3 py-2" value={t.mileageKm} onChange={(e) => updateTrip(t.id, { mileageKm: Number(e.target.value) || 0 })} />
                    </Row>
                    <Row label="Meals provided?">
                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={t.includeBreakfast} onChange={(e) => updateTrip(t.id, { includeBreakfast: e.target.checked })} />
                          Breakfast
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={t.includeLunch} onChange={(e) => updateTrip(t.id, { includeLunch: e.target.checked })} />
                          Lunch
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={t.includeDinner} onChange={(e) => updateTrip(t.id, { includeDinner: e.target.checked })} />
                          Dinner
                        </label>
                      </div>
                    </Row>
                    <div className="flex justify-between mt-3">
                      <button className="px-3 py-2 rounded-xl bg-white border hover:bg-gray-50" onClick={() => addExpense(t.id)}>+ Add expense</button>
                      <button className="px-3 py-2 rounded-xl bg-white border hover:bg-red-50 text-red-600" onClick={() => removeTrip(t.id)}>Delete trip</button>
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Expenses</SectionTitle>
                    <div className="grid gap-2">
                      {ex.length === 0 && <div className="text-sm text-gray-500">No expenses yet.</div>}
                      {ex.map((e) => (
                        <div key={e.id} className="grid grid-cols-12 gap-2 items-center">
                          <input type="date" className="col-span-3 border rounded-xl px-2 py-2" value={e.date} onChange={(ev) => updateExpense(e.id, { date: ev.target.value })} />
                          <select className="col-span-3 border rounded-xl px-2 py-2" value={e.category} onChange={(ev) => updateExpense(e.id, { category: ev.target.value as Expense["category"] })}>
                            <option>Hotel</option>
                            <option>Transport</option>
                            <option>Meal</option>
                            <option>Other</option>
                          </select>
                          <input className="col-span-2 border rounded-xl px-2 py-2" placeholder="Amount" type="number" step="0.01" value={e.amount} onChange={(ev) => updateExpense(e.id, { amount: Number(ev.target.value) })} />
                          <select className="col-span-2 border rounded-xl px-2 py-2" value={e.currency} onChange={(ev) => updateExpense(e.id, { currency: ev.target.value })}>
                            <option>EUR</option>
                            <option>USD</option>
                            <option>GBP</option>
                            <option>CHF</option>
                          </select>
                          <button className="col-span-2 px-2 py-2 rounded-xl bg-white border hover:bg-red-50 text-red-600" onClick={() => removeExpense(e.id)}>Remove</button>
                          <input className="col-span-12 border rounded-xl px-2 py-2" placeholder="Note (optional)" value={e.note || ""} onChange={(ev) => updateExpense(e.id, { note: ev.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <footer className="mt-10 text-xs text-gray-500">
          <p>Demo only — calculations simplified for prototyping. For production, plug in authoritative rule tables and validation.</p>
        </footer>
      </div>
    </div>
  );
}
