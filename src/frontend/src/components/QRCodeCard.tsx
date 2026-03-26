interface QRCodeCardProps {
  data: string;
  title?: string;
  subtitle?: string;
}

export function QRCodeCard({ data, title, subtitle }: QRCodeCardProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=111827&color=FFFFFF&margin=10`;

  return (
    <div
      className="bg-card border-2 border-orange rounded-2xl p-5 flex flex-col items-center gap-3"
      data-ocid="qr.card"
    >
      {title && (
        <div className="text-center">
          <div className="font-bold text-foreground">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-orange/30">
        <img
          src={qrUrl}
          alt="QR Code"
          width={180}
          height={180}
          className="block"
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Show at partner store for instant verification
      </p>
    </div>
  );
}
