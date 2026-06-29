import { useState } from "react";
import { ScanLine, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/useAuth";

const LANGUAGES = [
  { code: "sr", label: "Srpski", flag: "🇷🇸" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
];

export function AuthScreen(: { setLanguage: (lang: string) => void }) {
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
      setError(error.message.includes("Invalid login credentials") ? "Pogrešan email ili lozinka." : error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <ScanLine className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DocSkan</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              Registracija
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vas@email.com" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lozinka</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Prijavi se" : "Kreiraj nalog"}
            </button>
          </form>
        </div>

        {/* Zastave na dnu */}
        <div className="flex justify-center gap-4 mt-8">
          {LANGUAGES.map((lang) => (
            <button 
              key={lang.code} 
              onClick={() => setLanguage(lang.code)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-slate-200 hover:border-blue-500 text-sm font-bold text-slate-700 transition-all shadow-sm"
            >
              {lang.code.toUpperCase()}
            </button>
          ))}
        </div>