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
import { LISTING_SAYA, rowToListing } from "./data";
import { supabase, toE164, uploadCapture } from "./supabase";
import type { Database, Json } from "./database.types";
import type {
  Grade,
  GradingSuccess,
  Listing,
  Role,
  StatusPesanan,
} from "./types";

/**
 * Client-side application state, persisted to localStorage.
 *
 * With Supabase configured (web/.env.local) every action also writes to the
 * backend in the background and state hydrates from the database after a real
 * OTP login; without it, everything behaves exactly like the offline demo.
 * Local state stays the optimistic source of truth either way, so component
 * signatures are unchanged (docs/BACKEND.md).
 */

export interface Sesi {
  role: Role;
  phone: string;
  nama: string;
  /** UUID auth Supabase — hanya terisi bila login lewat OTP asli. */
  userId?: string;
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
  /** "sms" bila signInWithOtp sukses mengirim SMS; selain itu demo. */
  otpMode: "demo" | "sms";
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
  otpMode: "demo",
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

function namaDemo(role: Role) {
  return role === "petani" ? "Pak Warsono" : "PT Olahan Segar";
}

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  pembeli: { nama: string } | null;
  petani: { nama: string } | null;
};

function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    kode: r.kode,
    status: r.status as StatusPesanan,
    nama: r.nama,
    grade: r.grade as Grade,
    berat_kg: Number(r.berat_kg),
    harga_per_kg: r.harga_per_kg,
    total: Number(r.total),
    pembeli: r.pembeli?.nama ?? "Pembeli",
    petani: r.petani?.nama ?? "Petani",
    tanggal: r.created_at,
  };
}

interface Actions {
  /** Step 1 of login: stash role+phone and (bila Supabase aktif) kirim SMS OTP. */
  mulaiLogin(role: Role, phone: string): void;
  /**
   * Step 2: verify the OTP. Real mode checks the code via Supabase and returns
   * null when it is wrong; demo mode accepts any 6-digit code.
   */
  selesaiLogin(code?: string): Promise<Sesi | null>;
  logout(): void;

  setLastCapture(dataUrl: string | null): void;
  addScan(
    s: Omit<Scan, "id" | "tanggal"> & {
      /** Payload lengkap dari gradeBatch — dipersistenkan ke tabel gradings. */
      hasil?: GradingSuccess;
    },
  ): void;
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
  // Mirror for async actions that need current state without re-subscribing.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

  // After a real OTP login, replace the demo seeds with the user's own rows.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    const uid = state.sesi?.userId;
    if (!supabase || !uid || hydratedFor.current === uid) return;
    hydratedFor.current = uid;
    void (async () => {
      const [listingsRes, ordersRes, gradingsRes] = await Promise.all([
        supabase
          .from("listings_view")
          .select("*")
          .eq("petani_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(
            "*, pembeli:profiles!orders_pembeli_id_fkey(nama), petani:profiles!orders_petani_id_fkey(nama)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("gradings")
          .select("id, created_at, komoditas_label, grade_dominan, objek_terdeteksi, gambar_url")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setState((s) => ({
        ...s,
        myListings: listingsRes.error
          ? s.myListings
          : (listingsRes.data ?? []).map(rowToListing),
        orders: ordersRes.error
          ? s.orders
          : ((ordersRes.data ?? []) as OrderRow[]).map(rowToOrder),
        scans: gradingsRes.error
          ? s.scans
          : (gradingsRes.data ?? []).map((g) => ({
              id: g.id,
              tanggal: g.created_at,
              komoditas_label: g.komoditas_label,
              grade_dominan: g.grade_dominan as Grade,
              objek: g.objek_terdeteksi,
              gambar: g.gambar_url ?? "/img/tomat.jpg",
            })),
      }));
    })();
  }, [state.sesi]);

  const mulaiLogin = useCallback((role: Role, phone: string) => {
    setState((s) => ({
      ...s,
      pendingRole: role,
      pendingPhone: phone,
      otpMode: "demo",
    }));
    if (!supabase) return;
    void supabase.auth
      .signInWithOtp({
        phone: toE164(phone),
        options: { channel: "sms", data: { peran: role, nama: namaDemo(role) } },
      })
      .then(({ error }) => {
        if (error) {
          // Provider SMS belum dikonfigurasi (Twilio dkk.) — tetap mode demo.
          console.warn("[pantas] OTP SMS tidak terkirim, mode demo:", error.message);
        } else {
          setState((s) => ({ ...s, otpMode: "sms" }));
        }
      });
  }, []);

  const selesaiLogin = useCallback(
    async (code?: string): Promise<Sesi | null> => {
      const s = stateRef.current;
      if (!s.pendingRole || !s.pendingPhone) return null;

      let sesi: Sesi = {
        role: s.pendingRole,
        phone: s.pendingPhone,
        nama: namaDemo(s.pendingRole),
      };

      if (supabase && s.otpMode === "sms" && code) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: toE164(s.pendingPhone),
          token: code,
          type: "sms",
        });
        if (error || !data.user) return null; // kode salah/kedaluwarsa
        const { data: profil } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        sesi = {
          role: (profil?.peran as Role) ?? s.pendingRole,
          phone: s.pendingPhone,
          nama: profil?.nama ?? namaDemo(s.pendingRole),
          userId: data.user.id,
        };
      }

      setState((st) => ({
        ...st,
        sesi,
        pendingRole: null,
        pendingPhone: null,
      }));
      return sesi;
    },
    [],
  );

  const logout = useCallback(() => {
    void supabase?.auth.signOut();
    hydratedFor.current = null;
    setState((s) => ({
      ...INITIAL,
      scans: s.scans,
      orders: s.orders,
      myListings: s.myListings,
    }));
  }, []);

  const setLastCapture = useCallback((dataUrl: string | null) => {
    setState((s) => ({ ...s, lastCapture: dataUrl }));
  }, []);

  const addScan = useCallback(
    (input: Omit<Scan, "id" | "tanggal"> & { hasil?: GradingSuccess }) => {
      const { hasil, ...fields } = input;
      setState((s) => {
        const scan: Scan = {
          ...fields,
          id: `scan-${Date.now()}`,
          tanggal: new Date().toISOString(),
        };
        // Cap history: captures can be data URLs and localStorage is ~5MB.
        return { ...s, scans: [scan, ...s.scans].slice(0, 8) };
      });

      const sesi = stateRef.current.sesi;
      if (!supabase || !sesi?.userId || !hasil) return;
      void (async () => {
        const gambarUrl = fields.gambar.startsWith("data:")
          ? await uploadCapture(fields.gambar, sesi.userId!)
          : null;
        // annotated_img (data URL besar) tidak ikut disimpan ke jsonb.
        const hasilBersih = { ...hasil };
        delete hasilBersih.annotated_img;
        const { error } = await supabase.from("gradings").insert({
          petani_id: sesi.userId!,
          komoditas: hasil.komoditas,
          komoditas_label: fields.komoditas_label,
          grade_dominan: fields.grade_dominan,
          objek_terdeteksi: fields.objek,
          hasil: hasilBersih as unknown as Json,
          hash_audit: hasil.hash_audit,
          gambar_url: gambarUrl,
        });
        if (error) console.warn("[pantas] simpan grading gagal:", error.message);
      })();
    },
    [],
  );

  const publishListing = useCallback(
    (input: {
      nama: string;
      grade: Grade;
      berat_kg: number;
      harga_per_kg: number;
      gambar: string;
    }): Listing => {
      const sesi = stateRef.current.sesi;
      const id = `PNT-L-${Math.floor(1000 + Math.random() * 8999)}`;
      const listing: Listing = {
        id,
        nama: input.nama,
        komoditas: input.nama.toLowerCase().replace(/\s+/g, "_"),
        grade: input.grade,
        berat_kg: input.berat_kg,
        harga_per_kg: input.harga_per_kg,
        gambar: input.gambar,
        petani: sesi?.nama ?? "Pak Warsono",
        petani_id: sesi?.userId,
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

      if (supabase && sesi?.userId) {
        void (async () => {
          let gambar = input.gambar;
          if (gambar.startsWith("data:")) {
            const url = await uploadCapture(gambar, sesi.userId!);
            if (url) {
              gambar = url;
              setState((s) => ({
                ...s,
                myListings: s.myListings.map((l) =>
                  l.id === id ? { ...l, gambar: url } : l,
                ),
              }));
            }
          }
          const { error } = await supabase.from("listings").insert({
            id,
            petani_id: sesi.userId!,
            nama: listing.nama,
            komoditas: listing.komoditas,
            grade: listing.grade,
            berat_kg: listing.berat_kg,
            harga_per_kg: listing.harga_per_kg,
            gambar,
            stok_kg: listing.stok_kg,
            panen_terakhir: listing.panen_terakhir,
          });
          if (error)
            console.warn("[pantas] terbit listing ke DB gagal:", error.message);
        })();
      }
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
    const sesi = stateRef.current.sesi;
    const order: Order = {
      id: `PNT-${Math.floor(100 + Math.random() * 899)}`,
      kode: randKode(),
      status: "dipesan",
      nama: l.nama,
      grade: l.grade,
      berat_kg: qty,
      harga_per_kg: l.harga_per_kg,
      total: qty * l.harga_per_kg,
      pembeli: sesi?.nama ?? "PT Olahan Segar",
      petani: l.petani,
      tanggal: new Date().toISOString(),
    };
    setState((s) => {
      const inquiry = { ...s.inquiry };
      delete inquiry[l.id];
      return { ...s, orders: [order, ...s.orders], inquiry };
    });

    if (supabase && sesi?.userId && l.petani_id) {
      void supabase
        .from("orders")
        .insert({
          id: order.id,
          kode: order.kode,
          listing_id: l.id,
          pembeli_id: sesi.userId,
          petani_id: l.petani_id,
          status: order.status,
          nama: order.nama,
          grade: order.grade,
          berat_kg: order.berat_kg,
          harga_per_kg: order.harga_per_kg,
          total: order.total,
        })
        .then(({ error }) => {
          if (error)
            console.warn("[pantas] simpan pesanan ke DB gagal:", error.message);
        });
    }
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

      const sesi = stateRef.current.sesi;
      if (ok && supabase && sesi?.userId) {
        // Pencocokan resmi terjadi di server (RPC security definer).
        void supabase
          .rpc("verifikasi_serah_terima", { p_order_id: orderId, p_kode: kode })
          .then(({ data, error }) => {
            if (error || data !== true)
              console.warn(
                "[pantas] verifikasi serah terima di DB gagal:",
                error?.message ?? "kode ditolak server",
              );
          });
      }
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
