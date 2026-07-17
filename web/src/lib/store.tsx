"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LISTING_SAYA } from "./data";
import type { Grade, Listing, Role, StatusPesanan } from "./types";

/**
 * Client-side application state, persisted to localStorage.
 *
 * This is the v1 stand-in for Supabase: sessions, orders, published listings,
 * and scan history all live here so every flow works end-to-end offline.
 * When the backend lands (docs/BACKEND.md), these reducers become API calls —
 * the components consuming `useStore()` don't change shape.
 */

export interface Sesi {
  role: Role;
  phone: string;
  nama: string;
}

export interface Scan {
  id: string;
  tanggal: string; // ISO
  komoditas_label: string;
  grade_dominan: Grade;
  objek: number;
  gambar: string; // asset path or data URL
}

export interface Order {
  id: string;
  kode: string;
  status: StatusPesanan;
  nama: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  total: number;
  pembeli: string;
  petani: string;
  tanggal: string; // ISO
}

interface State {
  sesi: Sesi | null;
  pendingPhone: string | null;
  pendingRole: Role | null;
  scans: Scan[];
  myListings: Listing[];
  inquiry: Record<string, number>; // listingId -> qty (kg)
  orders: Order[];
  lastCapture: string | null; // data URL from the camera, feeds hasil/listing
  lastPublishedId: string | null;
}

const SEED_ORDERS: Order[] = [
  {
    id: "PNT-0092",
    kode: "PNT-7F3K-92",
    status: "serah_terima",
    nama: "Tomat Sayur",
    grade: "B",
    berat_kg: 120,
    harga_per_kg: 10000,
    total: 1_200_000,
    pembeli: "PT Olahan Segar",
    petani: "Pak Warsono",
    tanggal: "2026-07-15T09:43:00+07:00",
  },
  {
    id: "PNT-0091",
    kode: "PNT-2X8A-91",
    status: "dikonfirmasi",
    nama: "Cabai Rawit Merah",
    grade: "A",
    berat_kg: 40,
    harga_per_kg: 45000,
    total: 1_800_000,
    pembeli: "CV Saus Nusantara",
    petani: "Pak Warsono",
    tanggal: "2026-07-14T14:20:00+07:00",
  },
  {
    id: "PNT-0090",
    kode: "PNT-9Q4M-90",
    status: "selesai",
    nama: "Kubis Hijau",
    grade: "B",
    berat_kg: 300,
    harga_per_kg: 6000,
    total: 1_800_000,
    pembeli: "Dapur Katering Bandung",
    petani: "Pak Warsono",
    tanggal: "2026-07-12T08:05:00+07:00",
  },
];

const SEED_SCAN: Scan = {
  id: "scan-seed-1",
  tanggal: "2026-07-16T06:12:00+07:00",
  komoditas_label: "Cabai Merah Keriting",
  grade_dominan: "A",
  objek: 57,
  gambar: "/img/cabai-rawit.jpg",
};

const INITIAL: State = {
  sesi: null,
  pendingPhone: null,
  pendingRole: null,
  scans: [SEED_SCAN],
  myListings: LISTING_SAYA,
  inquiry: {},
  orders: SEED_ORDERS,
  lastCapture: null,
  lastPublishedId: null,
};

const KEY = "pantas-store-v1";

function randKode() {
  const c = () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)];
  return `PNT-${c()}${c()}${c()}${c()}-${Math.floor(10 + Math.random() * 89)}`;
}

interface Actions {
  /** Step 1 of login: stash the pending role+phone, then the OTP screen confirms. */
  mulaiLogin(role: Role, phone: string): void;
  /** Step 2: OTP verified (any code in demo mode) — create the session. */
  selesaiLogin(): Sesi | null;
  logout(): void;

  setLastCapture(dataUrl: string | null): void;
  addScan(s: Omit<Scan, "id" | "tanggal">): void;
  publishListing(input: {
    nama: string;
    grade: Grade;
    berat_kg: number;
    harga_per_kg: number;
    gambar: string;
  }): Listing;

  setInquiryQty(listingId: string, qty: number): void;
  clearInquiry(): void;

  createOrder(l: Listing, qty: number): Order;
  /** Petani confirms handover by keying in the buyer's code. */
  verifikasiSerahTerima(orderId: string, kode: string): boolean;
}

const Ctx = createContext<(State & Actions & { ready: boolean }) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    // One-time localStorage hydration. Must run in an effect (not the useState
    // initializer) so the server HTML and the client's first render agree.
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional single hydration pass
        setState((s) => ({ ...s, ...saved }));
      }
    } catch {
      // corrupt storage — start fresh rather than crash the app
      localStorage.removeItem(KEY);
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // quota exceeded (large captures) — drop the heavy field and retry
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...state, lastCapture: null }));
      } catch {
        /* storage unavailable — state stays in memory only */
      }
    }
  }, [state]);

  const mulaiLogin = useCallback((role: Role, phone: string) => {
    setState((s) => ({ ...s, pendingRole: role, pendingPhone: phone }));
  }, []);

  const selesaiLogin = useCallback((): Sesi | null => {
    let out: Sesi | null = null;
    setState((s) => {
      if (!s.pendingRole || !s.pendingPhone) return s;
      out = {
        role: s.pendingRole,
        phone: s.pendingPhone,
        nama: s.pendingRole === "petani" ? "Pak Warsono" : "PT Olahan Segar",
      };
      return { ...s, sesi: out, pendingRole: null, pendingPhone: null };
    });
    return out;
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({ ...INITIAL, scans: s.scans, orders: s.orders, myListings: s.myListings }));
  }, []);

  const setLastCapture = useCallback((dataUrl: string | null) => {
    setState((s) => ({ ...s, lastCapture: dataUrl }));
  }, []);

  const addScan = useCallback((input: Omit<Scan, "id" | "tanggal">) => {
    setState((s) => {
      const scan: Scan = {
        ...input,
        id: `scan-${Date.now()}`,
        tanggal: new Date().toISOString(),
      };
      // Cap history: captures can be data URLs and localStorage is ~5MB.
      return { ...s, scans: [scan, ...s.scans].slice(0, 8) };
    });
  }, []);

  const publishListing = useCallback(
    (input: {
      nama: string;
      grade: Grade;
      berat_kg: number;
      harga_per_kg: number;
      gambar: string;
    }): Listing => {
      const id = `PNT-L-${Math.floor(1000 + Math.random() * 8999)}`;
      const listing: Listing = {
        id,
        nama: input.nama,
        komoditas: input.nama.toLowerCase().replace(/\s+/g, "_"),
        grade: input.grade,
        berat_kg: input.berat_kg,
        harga_per_kg: input.harga_per_kg,
        gambar: input.gambar,
        petani: "Pak Warsono",
        lokasi: "Lembang, Bandung Barat",
        jarak_km: 4.2,
        rating: 4.8,
        transaksi: 96,
        lat: -6.8118,
        lng: 107.6175,
        stok_kg: input.berat_kg,
        panen_terakhir: "Hari ini",
      };
      setState((s) => ({
        ...s,
        myListings: [listing, ...s.myListings],
        lastPublishedId: id,
        lastCapture: null,
      }));
      return listing;
    },
    [],
  );

  const setInquiryQty = useCallback((listingId: string, qty: number) => {
    setState((s) => {
      const inquiry = { ...s.inquiry };
      if (qty <= 0) delete inquiry[listingId];
      else inquiry[listingId] = qty;
      return { ...s, inquiry };
    });
  }, []);

  const clearInquiry = useCallback(() => {
    setState((s) => ({ ...s, inquiry: {} }));
  }, []);

  const createOrder = useCallback((l: Listing, qty: number): Order => {
    const order: Order = {
      id: `PNT-${Math.floor(100 + Math.random() * 899)}`,
      kode: randKode(),
      status: "dipesan",
      nama: l.nama,
      grade: l.grade,
      berat_kg: qty,
      harga_per_kg: l.harga_per_kg,
      total: qty * l.harga_per_kg,
      pembeli: "PT Olahan Segar",
      petani: l.petani,
      tanggal: new Date().toISOString(),
    };
    setState((s) => {
      const inquiry = { ...s.inquiry };
      delete inquiry[l.id];
      return { ...s, orders: [order, ...s.orders], inquiry };
    });
    return order;
  }, []);

  const verifikasiSerahTerima = useCallback(
    (orderId: string, kode: string): boolean => {
      let ok = false;
      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target) return s;
        const clean = (x: string) => x.replace(/[\s-]/g, "").toUpperCase();
        if (clean(kode) !== clean(target.kode)) return s;
        ok = true;
        return {
          ...s,
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status: "selesai" } : o,
          ),
        };
      });
      return ok;
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      ready,
      mulaiLogin,
      selesaiLogin,
      logout,
      setLastCapture,
      addScan,
      publishListing,
      setInquiryQty,
      clearInquiry,
      createOrder,
      verifikasiSerahTerima,
    }),
    [
      state,
      ready,
      mulaiLogin,
      selesaiLogin,
      logout,
      setLastCapture,
      addScan,
      publishListing,
      setInquiryQty,
      clearInquiry,
      createOrder,
      verifikasiSerahTerima,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
