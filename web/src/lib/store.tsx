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
import { KOMODITAS_DEFAULT, rowToListing } from "./data";
import { supabase, uploadCapture } from "./supabase";
import type { Database, Json } from "./database.types";
import type {
  Grade,
  GradingSuccess,
  Listing,
  Role,
  StatusPesanan,
} from "./types";

/**
 * Client-side application state, cached to localStorage.
 *
 * The Supabase session is the single source of truth for *who* is signed in.
 * Listings, orders and scans are fetched per user and RLS scopes every row to
 * `auth.uid()`; localStorage is only a cache, keyed by user id, so two accounts
 * on the same device never inherit each other's data (docs/BACKEND.md).
 */

export interface Sesi {
  role: Role;
  email: string;
  nama: string;
  /** UUID auth Supabase — terisi setelah verifikasi OTP email berhasil. */
  userId?: string;
  /** Lokasi dari public.profiles — ditampilkan di halaman akun. */
  lokasi?: string;
}

export interface Scan {
  id: string;
  tanggal: string; // ISO
  komoditas_label: string;
  grade_dominan: Grade;
  objek: number;
  gambar: string; // asset path or data URL
  /** Skor keseragaman batch (0..1) dari ringkasan_batch. */
  skor?: number;
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
  scans: Scan[];
  myListings: Listing[];
  inquiry: Record<string, number>; // listingId -> qty (kg)
  orders: Order[];
  lastCapture: string | null; // data URL from the camera, feeds hasil/listing
  /**
   * Kotak [x, y, w, h] pada `lastCapture` tempat koin Rp500 diperkirakan
   * berada, dihitung dari lingkaran panduan di layar pindai. Tanpa ini
   * calibration.py menyapu seluruh foto dan bisa memakai tomat sebagai
   * referensi 27 mm. null untuk foto galeri / mode demo.
   */
  lastCoinRoi: [number, number, number, number] | null;
  /** Komoditas yang dipilih petani di layar pindai, dipakai oleh /hasil. */
  lastKomoditas: string;
  lastPublishedId: string | null;
}

/**
 * A new account starts empty and fills up from its own Supabase rows. Seeding
 * this with demo listings/scans is what made every device show the same
 * dashboard regardless of who was signed in.
 */
const INITIAL: State = {
  sesi: null,
  scans: [],
  myListings: [],
  inquiry: {},
  orders: [],
  lastCapture: null,
  lastCoinRoi: null,
  lastKomoditas: KOMODITAS_DEFAULT,
  lastPublishedId: null,
};

/**
 * Per-user cache bucket. Without the user id in the key, a second account on
 * the same browser would read the first account's listings and orders.
 */
const KEY_BASE = "pantas-store-v1";
const keyFor = (uid?: string) => `${KEY_BASE}:${uid ?? "anon"}`;

function randKode() {
  const c = () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)];
  return `PNT-${c()}${c()}${c()}${c()}-${Math.floor(10 + Math.random() * 89)}`;
}

/** "budi.tani@mail.com" -> "Budi Tani" — nama awal sebelum pengguna mengubahnya. */
function namaDariEmail(email: string) {
  const nama = (email.split("@")[0] ?? "")
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return nama || "Pengguna PANTAS";
}

/** Pesan Supabase Auth -> kalimat yang berarti bagi petani. */
function pesanAuth(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email sudah terdaftar — password yang Anda masukkan salah.";
  if (m.includes("password") && m.includes("at least"))
    return "Password minimal 6 karakter.";
  if (m.includes("invalid email") || m.includes("email address"))
    return "Format email tidak valid.";
  if (m.includes("not confirmed"))
    return 'Akun ini menunggu konfirmasi email. Matikan "Confirm email" di Supabase → Authentication → Sign In / Providers → Email, lalu masuk lagi.';
  if (m.includes("rate limit") || m.includes("too many"))
    // Kuota SMTP bawaan Supabase (~2 email/jam) habis karena signup masih
    // memicu email konfirmasi. Menunggu tidak menyelesaikan akar masalahnya.
    return 'Kuota email Supabase habis karena "Confirm email" masih aktif. Matikan di Authentication → Sign In / Providers → Email — setelah itu pendaftaran tidak mengirim email sama sekali.';
  return message;
}

/** Skor keseragaman dari payload grading (jsonb), bila ada. */
function skorDariHasil(hasil: Json | null): number | undefined {
  const skor = (hasil as unknown as GradingSuccess | null)?.ringkasan_batch
    ?.skor_keseragaman;
  return typeof skor === "number" ? skor : undefined;
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
  /**
   * Masuk dengan email + password. Akun dibuat otomatis pada percobaan
   * pertama, tanpa langkah verifikasi email. Mengembalikan pesan error siap
   * tampil bila gagal.
   */
  masuk(
    role: Role,
    email: string,
    password: string,
  ): Promise<{ sesi: Sesi | null; error: string | null }>;
  logout(): void;

  setLastCapture(
    dataUrl: string | null,
    komoditas?: string,
    coinRoi?: [number, number, number, number] | null,
  ): void;
  addScan(
    s: Omit<Scan, "id" | "tanggal"> & {
      /** Payload lengkap dari gradeBatch — dipersistenkan ke tabel gradings. */
      hasil?: GradingSuccess;
    },
  ): void;
  publishListing(input: {
    nama: string;
    /** Id komoditas engine; tanpa ini slug diturunkan dari nama tampilan. */
    komoditas?: string;
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
  const storageKey = useRef(keyFor());
  // Mirror for async actions that need current state without re-subscribing.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Boot: ask Supabase who is signed in, then load that user's cache bucket.
    // Must run in an effect (not the useState initializer) so the server HTML
    // and the client's first render agree.
    let cancelled = false;
    void (async () => {
      let sesi: Sesi | null = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const user = data.session?.user;
        if (user) {
          const { data: profil } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (cancelled) return;
          sesi = {
            role: (profil?.peran as Role) ?? "petani",
            email: user.email ?? "",
            nama: profil?.nama ?? namaDariEmail(user.email ?? ""),
            userId: user.id,
            lokasi: profil?.lokasi ?? undefined,
          };
        }
      }
      storageKey.current = keyFor(sesi?.userId);

      let saved: Partial<State> | null = null;
      try {
        const raw = localStorage.getItem(storageKey.current);
        if (raw) saved = JSON.parse(raw) as Partial<State>;
      } catch {
        // corrupt storage — start fresh rather than crash the app
        localStorage.removeItem(storageKey.current);
      }

      setState((s) => ({
        ...s,
        ...(saved ?? {}),
        // An expired or absent Supabase session must not leave a stale `sesi`
        // behind: that is what let any device land straight on a dashboard.
        sesi: supabase ? sesi : (saved?.sesi ?? null),
      }));
      loaded.current = true;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(storageKey.current, JSON.stringify(state));
    } catch {
      // quota exceeded (large captures) — drop the heavy field and retry
      try {
        localStorage.setItem(
          storageKey.current,
          JSON.stringify({ ...state, lastCapture: null }),
        );
      } catch {
        /* storage unavailable — state stays in memory only */
      }
    }
  }, [state]);

  // Once we know the user, replace the cache with their own rows.
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
          .select(
            "id, created_at, komoditas_label, grade_dominan, objek_terdeteksi, gambar_url, hasil",
          )
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
              skor: skorDariHasil(g.hasil),
            })),
      }));
    })();
  }, [state.sesi]);

  const masuk = useCallback(
    async (
      role: Role,
      email: string,
      password: string,
    ): Promise<{ sesi: Sesi | null; error: string | null }> => {
      const bersih = email.trim().toLowerCase();

      const pakai = (sesi: Sesi) => {
        if (sesi.userId) {
          // Pindah ke bucket cache milik akun ini dan buang bucket anonim, agar
          // tidak ada sisa data dari sesi sebelumnya di perangkat yang sama.
          try {
            localStorage.removeItem(keyFor());
          } catch {
            /* storage unavailable */
          }
          storageKey.current = keyFor(sesi.userId);
        }
        setState((st) => ({
          ...st,
          sesi,
          // Data akun ini datang dari hidrasi Supabase.
          scans: [],
          myListings: [],
          orders: [],
          inquiry: {},
        }));
        return { sesi, error: null };
      };

      // Tanpa backend: sesi lokal saja (demo offline).
      if (!supabase) {
        return pakai({ role, email: bersih, nama: namaDariEmail(bersih) });
      }

      const masukRes = await supabase.auth.signInWithPassword({
        email: bersih,
        password,
      });
      let user = masukRes.data.user;

      if (masukRes.error) {
        // Supabase menyamarkan "email tidak dikenal" dan "password salah" jadi
        // satu pesan, jadi coba daftar dan biarkan server yang memutuskan.
        const daftarRes = await supabase.auth.signUp({
          email: bersih,
          password,
          // `data` hanya dipakai saat akun dibuat — trigger handle_new_user
          // menyalinnya ke public.profiles.
          options: { data: { peran: role, nama: namaDariEmail(bersih) } },
        });
        if (daftarRes.error) {
          return { sesi: null, error: pesanAuth(daftarRes.error.message) };
        }
        if (!daftarRes.data.session) {
          // Dengan proteksi enumerasi email aktif, signUp untuk email yang
          // sudah ada tidak melempar error — ia balas user tanpa identities.
          const sudahTerdaftar =
            (daftarRes.data.user?.identities?.length ?? 0) === 0;
          return {
            sesi: null,
            error: sudahTerdaftar
              ? "Email sudah terdaftar — password yang Anda masukkan salah."
              : 'Akun dibuat, tapi proyek Supabase masih meminta konfirmasi email. Matikan "Confirm email" di Authentication → Providers → Email, lalu coba lagi.',
          };
        }
        user = daftarRes.data.user;
      }

      if (!user) return { sesi: null, error: "Gagal masuk. Coba lagi." };

      const { data: profil } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return pakai({
        // Peran di profil menang: satu akun tetap satu peran.
        role: (profil?.peran as Role) ?? role,
        email: bersih,
        nama: profil?.nama ?? namaDariEmail(bersih),
        userId: user.id,
        lokasi: profil?.lokasi ?? undefined,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    void supabase?.auth.signOut();
    hydratedFor.current = null;
    try {
      localStorage.removeItem(storageKey.current);
    } catch {
      /* storage unavailable */
    }
    storageKey.current = keyFor();
    // Full reset. Carrying scans/orders/listings across logout is what leaked
    // one account's data into the next login on the same device.
    setState(INITIAL);
  }, []);

  const setLastCapture = useCallback(
    (
      dataUrl: string | null,
      komoditas?: string,
      coinRoi: [number, number, number, number] | null = null,
    ) => {
      setState((s) => ({
        ...s,
        lastCapture: dataUrl,
        lastCoinRoi: coinRoi,
        lastKomoditas: komoditas ?? s.lastKomoditas,
      }));
    },
    [],
  );

  const addScan = useCallback(
    (input: Omit<Scan, "id" | "tanggal"> & { hasil?: GradingSuccess }) => {
      const { hasil, ...fields } = input;
      setState((s) => {
        const scan: Scan = {
          ...fields,
          skor: fields.skor ?? hasil?.ringkasan_batch?.skor_keseragaman,
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
      komoditas?: string;
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
        komoditas:
          input.komoditas ?? input.nama.toLowerCase().replace(/\s+/g, "_"),
        grade: input.grade,
        berat_kg: input.berat_kg,
        harga_per_kg: input.harga_per_kg,
        gambar: input.gambar,
        petani: sesi?.nama ?? "Petani PANTAS",
        petani_id: sesi?.userId,
        lokasi: sesi?.lokasi ?? "",
        jarak_km: 0,
        rating: 0,
        transaksi: 0,
        lat: 0,
        lng: 0,
        stok_kg: input.berat_kg,
        panen_terakhir: "Baru saja",
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
      pembeli: sesi?.nama ?? "Pembeli PANTAS",
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
      masuk,
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
      masuk,
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
