"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatAngka } from "@/lib/format";
import type { Listing } from "@/lib/types";

const CENTER: [number, number] = [-6.8118, 107.6175];

/** Price pill markers, matching the Figma map. */
function priceIcon(harga: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:inline-block;white-space:nowrap;
      background:${active ? "#1b4332" : "#2d6a4f"};
      color:#fff;font-weight:700;font-size:11px;
      padding:4px 8px;border-radius:6px;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
      transform:translate(-50%,-140%);
    ">Rp ${formatAngka(harga)}</span>`,
    iconSize: [0, 0],
  });
}

const meIcon = L.divIcon({
  className: "",
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:50%;
    background:#2563eb;border:2.5px solid #fff;
    box-shadow:0 0 0 4px rgba(37,99,235,.25);
    transform:translate(-50%,-50%);
  "></span>`,
  iconSize: [0, 0],
});

/** Keep every listing in view without hardcoding a zoom. */
function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds([
      CENTER,
      ...listings.map((l) => [l.lat, l.lng] as [number, number]),
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, listings]);
  return null;
}

export default function PetaMap({
  listings,
  selectedId,
  onSelect,
}: {
  listings: Listing[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <MapContainer
      center={CENTER}
      zoom={12}
      scrollWheelZoom={false}
      className="size-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds listings={listings} />

      <Marker position={CENTER} icon={meIcon}>
        <Tooltip direction="top">Lokasi Anda</Tooltip>
      </Marker>

      {listings.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={priceIcon(l.harga_per_kg, l.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(l.id) }}
        >
          <Tooltip direction="top">
            {l.nama} • {l.jarak_km} km
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
