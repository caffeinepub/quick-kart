import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface AddressData {
  flat: string;
  building: string;
  landmark: string;
  area: string;
  pincode: string;
  type: string;
}

export function DeliveryAddressCard({ address }: { address: AddressData }) {
  const [copied, setCopied] = useState(false);

  const fullAddress = `${address.flat}, ${address.building}, Near ${address.landmark}, ${address.area} - ${address.pincode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-card border border-orange/30 rounded-xl p-4 space-y-1"
      data-ocid="address.card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-orange uppercase tracking-wider">
          📍 {address.type || "Home"}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-orange">{address.flat}</div>
      <div className="text-lg font-semibold text-foreground">
        {address.building}
      </div>
      <div className="text-sm font-medium text-amber italic">
        🏁 Near {address.landmark}
      </div>
      <div className="text-sm text-muted-foreground">
        {address.area} - {address.pincode}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 flex items-center gap-1.5 text-xs text-orange border border-orange/40 rounded-full px-3 py-1.5 hover:bg-orange/10 transition-colors"
        data-ocid="address.secondary_button"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "📋 Copy Address"}
      </button>
    </div>
  );
}
