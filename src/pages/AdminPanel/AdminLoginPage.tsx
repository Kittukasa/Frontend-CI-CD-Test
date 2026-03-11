import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  buildAdminAuthHeaders,
  getAdminToken,
  persistAdminIdentity,
  persistAdminToken,
} from "@/utils/adminAuth";

type AdminProfileResponse = {
  adminName?: string;
  displayName?: string;
  lastLoginAt?: string | null;
};

const AdminLoginPage = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state?.from as string) || "/admin-panel";

  useEffect(() => {
    if (getAdminToken()) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userName.trim() || !password.trim()) {
      return;
    }
    setStatusMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAdminAuthHeaders(),
        },
        body: JSON.stringify({
          adminName: userName.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as {
        token?: string;
        error?: string;
        admin?: AdminProfileResponse;
      };

      if (!response.ok || !payload?.token) {
        const message = payload?.error || "Unable to authenticate";
        throw new Error(message);
      }

      persistAdminToken(payload.token);
      const resolvedAdminName = payload.admin?.adminName || userName.trim();
      const resolvedDisplayName = payload.admin?.displayName || resolvedAdminName;
      persistAdminIdentity({
        adminName: resolvedAdminName,
        displayName: resolvedDisplayName,
      });
      setStatusMessage("Login successful. Redirecting to control room…");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !userName.trim() || !password.trim() || isSubmitting;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#050816] px-4 py-12 text-white">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:bg-white/10"
      >
        Home
      </button>
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50 text-center">
          Secure login
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/90">Admin</p>
          <h1 className="text-3xl font-bold">Billbox Control Room</h1>
          <p className="text-sm text-white/70">Sign in to manage stores, alerts, and campaigns.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="admin-username" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              User name
            </label>
            <input
              id="admin-username"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Enter admin user name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-cyan-300/60 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-white/40 focus:border-cyan-300/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/70 to-indigo-500/70 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_15px_40px_rgba(14,165,233,0.35)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <p className="text-center text-xs uppercase tracking-[0.3em] text-rose-300">{error}</p>}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          <p className="font-semibold uppercase tracking-[0.3em] text-white/50">Security</p>
          <p className="mt-2">This environment is restricted to authorized Billbox administrators.</p>
        </div>
        {statusMessage && (
          <p className="text-center text-xs uppercase tracking-[0.3em] text-cyan-200/80">{statusMessage}</p>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
