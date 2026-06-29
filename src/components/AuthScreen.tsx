import { useState } from "react";
import { ScanLine, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/useAuth";

function FlagSerbia() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="w-10 h-7 rounded shadow-sm">
      <rect width="60" height="40" fill="#C6363C" />
      <rect width="60" height="26.67" fill="#0C4076" />
      <rect width="60" height="13.33" fill="#C6363C" />
      {/* White stripe */}
      <rect y="13.33" width="60" height="13.34" fill="#EEE" />
      {/* Red bottom */}
      <rect y="26.67" width="60" height="13.33" fill="#C6363C" />
      {/* Coat of arms simplified: golden eagle shield */}
      <rect x="7" y="8" width="16" height="20" rx="1" fill="#C6363C" />
      <path d="M7 8 Q15 2 23 8" fill="#C6363C" />
      <rect x="8" y="9" width="14" height="18" rx="1" fill="#C6363C" stroke="#D4AF37" strokeWidth="1" />
      <text x="15" y="22" textAnchor="middle" fontSize="11" fill="#D4AF37" fontWeight="bold">✦</text>
    </svg>
  );
}

function FlagCroatia() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="w-10 h-7 rounded shadow-sm">
      <rect width="60" height="40" fill="#FF0000" />
      <rect width="60" height="13.33" fill="#FF0000" />
      <rect y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#0038A8" />
      {/* Checkered coat of arms */}
      <rect x="22" y="7" width="16" height="18" rx="1" fill="white" stroke="#ccc" strokeWidth="0.5" />
      {[0,1,2,3].map(col =>
        [0,1,2,3,4].map(row => {
          const isDark = (col + row) % 2 === 0;
          return (
            <rect
              key={`${col}-${row}`}
              x={22 + col * 4}
              y={7 + row * 3.6}
              width="4"
              height="3.6"
              fill={isDark ? "#FF0000" : "#FFFFFF"}
            />
          );
        })
      )}
    </svg>
  );
}

function FlagBosnia() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="w-10 h-7 rounded shadow-sm">
      <rect width="60" height="40" fill="#002395" />
      {/* Yellow triangle */}
      <polygon points="8,0 52,0 8,40" fill="#FCDD09" />
      {/* Stars along the diagonal */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const x = 36 + i * 3.2;
        const y = 1.5 + i * 5.3;
        return (
          <text key={i} x={x} y={y + 4} textAnchor="middle" fontSize="5" fill="white">★</text>
        );
      })}
      {/* Partial top star */}
      <text x="34" y="4" textAnchor="middle" fontSize="5" fill="white">★</text>
    </svg>
  );
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      setLoading(false);
      return;
    }

    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Pogresán email ili lozinka.");
      } else if (
        error.message.includes("already registered") ||
        error.message.includes("already been registered")
      ) {
        setError("Korisnik sa ovim emailom vec postoji. Prijavite se.");
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <ScanLine className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DocSkan</h1>
          <p className="text-sm text-slate-500 mt-1.5 text-center">
            Skeniraj dokumente, prevedi i dobij sazetek
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Registracija
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lozinka</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Prijavi se" : "Kreiraj nalog"}
            </button>
          </form>
        </div>

        {/* Flag row — static, non-clickable */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex flex-col items-center gap-1.5" aria-label="Srpski">
            <FlagSerbia />
            <span className="text-xs text-slate-400">Srpski</span>
          </div>
          <div className="flex flex-col items-center gap-1.5" aria-label="Hrvatski">
            <FlagCroatia />
            <span className="text-xs text-slate-400">Hrvatski</span>
          </div>
          <div className="flex flex-col items-center gap-1.5" aria-label="Bosanski">
            <FlagBosnia />
            <span className="text-xs text-slate-400">Bosanski</span>
          </div>
        </div>
      </div>
    </div>
  );
}
