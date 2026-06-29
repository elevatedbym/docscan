import { useState, useRef } from "react";
import {
  ScanLine, Upload, Image as ImageIcon, Loader2, LogOut, Sparkles,
  Languages, FileText, AlertCircle, CheckCircle2, Lock, X, RotateCcw,
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { useScans } from "../lib/useScans";
import { supabase, FREE_SCAN_LIMIT } from "../lib/supabase";

const LANGUAGES = [
  { code: "sr", label: "Srpski" },
  { code: "hr", label: "Hrvatski" },
  { code: "bs", label: "Bosanski" },
];

type Status = "idle" | "uploading" | "analyzing" | "done" | "error";

export function ScannerScreen() {
  const { user, signOut } = useAuth();
  const { scans, scansUsed, scansRemaining, limitReached, refresh } = useScans(user?.id ?? null);

  const [selectedLanguage, setSelectedLanguage] = useState("sr");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ translated_text: string; summary: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Molimo izaberite sliku.");
      setStatus("error");
      return;
    }

    setErrorMsg(null);
    setResult(null);
    setStatus("uploading");

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) {
      setErrorMsg("Greška pri uploadu slike. Pokušajte ponovo.");
      setStatus("error");
      return;
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
    setUploadedPath(fileName);
    setImagePreview(urlData.publicUrl);
    setStatus("idle");
  };

  const handleAnalyze = async () => {
    if (!imagePreview || !uploadedPath) return;
    if (limitReached) return;

    setStatus("analyzing");
    setErrorMsg(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: imagePreview, targetLanguage: selectedLanguage }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Greška servisa (${response.status})`);
      }

      const data = await response.json();

      if (!data.translated_text && !data.summary) {
        throw new Error("AI servis nije vratio očekivane podatke.");
      }

      const { error: insertError } = await supabase.from("scans").insert({
        image_url: imagePreview,
        target_language: selectedLanguage,
        translated_text: data.translated_text,
        summary: data.summary,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
      }

      setResult(data);
      setStatus("done");
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Greška pri analizi dokumenta.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setUploadedPath(null);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-slate-900">DocScan</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Odjava"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {/* Credits indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Besplatna skeniranja</span>
            <span className={`text-sm font-semibold ${limitReached ? "text-red-600" : "text-slate-900"}`}>
              {scansRemaining} / {FREE_SCAN_LIMIT}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: FREE_SCAN_LIMIT }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < scansUsed ? "bg-blue-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Limit reached banner */}
        {limitReached && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  Pretplatite se za dalje korišćenje
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Iskoristili ste sva {FREE_SCAN_LIMIT} besplatna skeniranja.
                </p>
                <button className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors">
                  Pretplati se
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload area — shown when no image selected and limit not reached */}
        {!imagePreview && !limitReached && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-4 transition-colors">
              <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="font-medium text-slate-700 text-sm">Učitajte dokument</p>
            <p className="text-xs text-slate-400 mt-1">Kliknite da izaberete sliku dokumenta</p>
          </div>
        )}

        {/* Hidden file input always in DOM */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Image preview + controls */}
        {imagePreview && !limitReached && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <img
                src={imagePreview}
                alt="Dokument"
                className="w-full max-h-72 object-contain bg-slate-50"
              />
              {status !== "analyzing" && (
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                  aria-label="Ukloni sliku"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Language selector */}
            {status !== "analyzing" && status !== "done" && (
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                  <Languages className="w-4 h-4" />
                  Izaberite jezik prevoda
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`flex items-center justify-center py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedLanguage === lang.code
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze button */}
            {status !== "analyzing" && status !== "done" && (
              <button
                onClick={handleAnalyze}
                disabled={status === "uploading"}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                Analiziraj i prevedi
              </button>
            )}

            {/* Uploading state */}
            {status === "uploading" && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Učitavanje slike...
              </div>
            )}

            {/* Analyzing state */}
            {status === "analyzing" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 absolute" />
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-medium text-slate-700 mt-4">AI analizira dokument...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Prevođenje na {LANGUAGES.find((l) => l.code === selectedLanguage)?.label}
                </p>
              </div>
            )}

            {/* Error */}
            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Result */}
            {status === "done" && result && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">Sažetak</h3>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">Prevedeni tekst</h3>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {result.translated_text}
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Skeniraj novi dokument
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scan history */}
        {scans.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-sm font-medium text-slate-700 mb-3"
            >
              <span>Istorija skeniranja ({scans.length})</span>
              <ImageIcon className="w-4 h-4 text-slate-400" />
            </button>
            {showHistory && (
              <div className="space-y-2">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="bg-white rounded-xl border border-slate-200 p-3 flex gap-3"
                  >
                    <img
                      src={scan.image_url}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-slate-500">
                          {LANGUAGES.find((l) => l.code === scan.target_language)?.label}
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">
                          {new Date(scan.created_at).toLocaleDateString("sr-RS")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {scan.summary || "Nema sažetka"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
