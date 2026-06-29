import { useState } from "react";
import { ScanLine, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/useAuth";

// Zastave kao jednostavne, jasne ikone
function FlagSerbia() {
  return <svg viewBox="0 0 3 2" className="w-10 h-7 rounded shadow-sm"><rect fill="#C6363C" width="3" height="1"/><rect fill="#0C4076" y="1" width="3" height="1"/><rect fill="#EEE" y="0.66" width="3" height="0.66"/></svg>;
}

function FlagCroatia() {
  return <svg viewBox="0 0 3 2" className="w-10 h-7 rounded shadow-sm"><rect fill="#FF0000" width="3" height="0.66"/><rect fill="#FFFFFF" y="0.66" width="3" height="0.66"/><rect fill="#0038A8" y="1.33" width="3" height="0.66"/></svg>;
}

function FlagBosnia() {
  return <svg viewBox="0 0 3 2" className="w-10 h-7 rounded shadow-sm"><rect fill="#002395" width="3" height="2"/><polygon points="0.4,0 2.6,0 0.4,2" fill="#FCDD09"/></svg>;
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
    const { error } = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    if (error) setError(error.message);
    setLoading(false);
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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 border border-slate-300 rounded-lg" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lozinka" required className="w-full p-2 border border-slate-300 rounded-lg" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg">
              {mode === "signin" ? "Prijava" : "Registracija"}
            </button>
          </form>
        </div>

       {/* Zastave kao slike - najsigurniji prikaz */}
        <div className="flex justify-center gap-6 mt-8">
          <img src="https://flagcdn.com/w40/rs.png" alt="Srbija" className="w-10 h-7 object-cover rounded shadow-sm" />
          <img src="https://flagcdn.com/w40/hr.png" alt="Hrvatska" className="w-10 h-7 object-cover rounded shadow-sm" />
          <img src="https://flagcdn.com/w40/ba.png" alt="Bosna i Hercegovina" className="w-10 h-7 object-cover rounded shadow-sm" />
        </div> 
  );
}