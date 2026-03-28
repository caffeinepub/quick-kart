import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthAddress } from "../store/authStore";
import { useAuthStore } from "../store/authStore";

interface LoginScreenProps {
  onSuccess: () => void;
  allowClose?: boolean;
  onClose?: () => void;
}

type Step = "phone" | "otp" | "profile";

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

export function LoginScreen({
  onSuccess,
  allowClose,
  onClose,
}: LoginScreenProps) {
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState<AuthAddress>({
    flat: "",
    building: "",
    landmark: "",
    area: "",
    pincode: "",
    type: "Home",
  });
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(generated);
    toast.success(`🔐 Your OTP is: ${generated}`, { duration: 10000 });
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    const entered = otp.join("");
    if (entered.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    if (entered !== generatedOtp) {
      setOtpError("Incorrect OTP. Please try again.");
      return;
    }
    setOtpError("");
    // Check if returning user
    const saved = localStorage.getItem("quickkart-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed?.state?.user?.phone === `+91${phone}` &&
          parsed?.state?.user?.name
        ) {
          login(parsed.state.user);
          toast.success(`Welcome back, ${parsed.state.user.name}! 🎉`);
          onSuccess();
          return;
        }
      } catch {}
    }
    setStep("profile");
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!address.flat || !address.building || !address.pincode) {
      toast.error("Please fill required address fields");
      return;
    }
    login({
      phone: `+91${phone}`,
      name: name.trim(),
      address,
      orderIds: [],
    });
    toast.success(`Welcome to Quick Kart, ${name.trim()}! 🎉`);
    onSuccess();
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleResend = () => {
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(generated);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    toast.success(`🔐 New OTP: ${generated}`, { duration: 10000 });
  };

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
  }, [step]);

  const stepIndex = step === "phone" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-ocid="login.modal"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={allowClose ? onClose : undefined}
      />

      {/* Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Orange top accent */}
        <div className="h-1 w-full orange-gradient" />

        {/* Close */}
        {allowClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground text-lg z-10"
            data-ocid="login.close_button"
          >
            ×
          </button>
        )}

        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(92dvh - 4px)" }}
        >
          {/* Logo */}
          <div className="pt-6 pb-2 px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="text-2xl font-black orange-gradient-text tracking-tight">
                ⚡ QUICK KART
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Delivered in 10–30 min
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 px-6 py-3">
            {["Phone", "OTP", "Profile"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < stepIndex
                      ? "bg-green-500 text-white"
                      : i === stepIndex
                        ? "orange-gradient text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs ${
                    i === stepIndex
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
                {i < 2 && <div className="w-4 h-px bg-border ml-1" />}
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-8 space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Enter your phone number
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll send an OTP to verify your number
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-xl overflow-hidden border border-border focus-within:ring-2 focus-within:ring-orange/40">
                  <span className="px-3 py-3 text-sm font-bold text-foreground bg-muted border-r border-border">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    data-ocid="login.input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3.5 orange-gradient text-white font-black text-base rounded-xl shadow-orange"
                  data-ocid="login.submit_button"
                >
                  Send OTP →
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <span className="text-orange">
                    Terms &amp; Privacy Policy
                  </span>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-8 space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Verify OTP
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sent to{" "}
                    <span className="font-semibold text-foreground">
                      +91 {phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="ml-2 text-orange text-xs"
                    >
                      Change
                    </button>
                  </p>
                </div>
                <div
                  className="flex gap-2 justify-between"
                  data-ocid="login.otp.input"
                >
                  {OTP_SLOTS.map((slot) => (
                    <input
                      key={slot}
                      ref={(el) => {
                        otpRefs.current[slot] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[slot]}
                      onChange={(e) => handleOtpInput(slot, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(slot, e)}
                      className={`w-11 h-12 text-center text-lg font-black rounded-xl border-2 bg-muted text-foreground focus:outline-none transition-all ${
                        otpError
                          ? "border-destructive"
                          : otp[slot]
                            ? "border-orange"
                            : "border-border focus:border-orange"
                      }`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p
                    className="text-xs text-destructive font-semibold"
                    data-ocid="login.error_state"
                  >
                    {otpError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full py-3.5 orange-gradient text-white font-black text-base rounded-xl shadow-orange"
                  data-ocid="login.confirm_button"
                >
                  Verify OTP ✓
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-sm text-orange font-semibold"
                    data-ocid="login.secondary_button"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            )}

            {step === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-8 space-y-3"
              >
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Complete Your Profile
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tell us a bit about yourself
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 border border-border"
                  data-ocid="login.name.input"
                />
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Delivery Address
                  </p>
                  <input
                    type="text"
                    placeholder="House No / Flat *"
                    value={address.flat}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, flat: e.target.value }))
                    }
                    className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 border border-border"
                    data-ocid="login.address.input"
                  />
                  <input
                    type="text"
                    placeholder="Building / Society *"
                    value={address.building}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, building: e.target.value }))
                    }
                    className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 border border-border"
                    data-ocid="login.address.input"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (important for delivery)"
                    value={address.landmark}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, landmark: e.target.value }))
                    }
                    className="w-full bg-amber/10 border border-amber/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-amber/70 focus:outline-none focus:ring-2 focus:ring-amber/40"
                    data-ocid="login.address.input"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Area / Sector"
                      value={address.area}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, area: e.target.value }))
                      }
                      className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 border border-border"
                      data-ocid="login.address.input"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, pincode: e.target.value }))
                      }
                      className="w-28 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 border border-border"
                      data-ocid="login.address.input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full py-3.5 orange-gradient text-white font-black text-base rounded-xl shadow-orange mt-2"
                  data-ocid="login.save_button"
                >
                  Save &amp; Continue 🎉
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
