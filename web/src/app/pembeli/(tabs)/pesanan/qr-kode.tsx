import QRCode from "qrcode";

/**
 * Rendered on the server to plain SVG — the seller scans this at handover, so
 * it has to be a real code, not a decorative placeholder.
 */
export default async function QrKode({ value }: { value: string }) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#111827", light: "#ffffff00" },
  });

  return (
    <div
      className="size-44 rounded-lg bg-canvas p-3 [&>svg]:size-full"
      role="img"
      aria-label={`Kode QR transaksi ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
