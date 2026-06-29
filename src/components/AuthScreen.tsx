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

    const { error } = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  const changeLanguage = (lang: string) => {
    localStorage.setItem("language", lang);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">DocSkan</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 border rounded-lg" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lozinka" required className="w-full p-2 border rounded-lg" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg">
              {mode === "signin" ? "Prijava" : "Registracija"}
            </button>
          </form>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {["sr", "hr", "bs"].map((lang) => (
            <button 
              key={lang} 
              onClick={() => changeLanguage(lang)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-300 font-bold hover:border-blue-500 transition-all"
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}