import { useState } from "react";
import { ScanLine, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/useAuth";

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

    const { error } = mode === "signin" ? await signIn(email, password) : await signUp(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Pogrešan email ili lozinka.");
      } else if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        setError("Korisnik sa ovim emailom već postoji. Prijavite se.");
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
            Skeniraj dokumente, prevedi i dobij sažetak
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

        <p className="text-center text-xs text-slate-400 mt-6">
          3 besplatna skeniranja · Prevod na srpski, hrvatski ili bosanski
        </p>
      </div>
    </div>
  );
}
