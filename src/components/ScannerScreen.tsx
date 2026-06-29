import { useState, useRef } from "react";
import {
  ScanLine, Upload, Image as ImageIcon, Loader2, LogOut, Sparkles,
  Languages, FileText, AlertCircle, CheckCircle2, Lock, X, RotateCcw,
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { useScans } from "../lib/useScans";
import { supabase, FREE_SCAN_LIMIT } from "../lib/supabase";

const LANGUAGES = [
  { code: "sr", label: "Srpski", flag: "🇷🇸" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
];

type Status = "idle" | "uploading" | "analyzing" | "done" | "error";

export function ScannerScreen() {
  const { user, signOut } = useAuth();
  
  // Ako user još nije tu, prikaži nešto neutralno umesto da se sve sruši
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Učitavanje korisnika...</div>;
  }

  const { scans, scansUsed, scansRemaining, limitReached, refresh } = useScans(user.id);

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
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) {
      setErrorMsg("Greška pri uploadu slike: " + uploadError.message);
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` // Ovde je sada siguran razmak
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `Prevedi na ${selectedLanguage}. Vrati JSON sa translated_text i summary.` },
                { type: "image_url", image_url: { url: imagePreview } }
              ]
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) throw new Error("Veza sa AI servisom nije uspela.");

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      await supabase.from("scans").insert({
        user_id: user.id,
        image_url: imagePreview,
        target_language: selectedLanguage,
        translated_text: content.translated_text,
        summary: content.summary,
      });

      setResult(content);
      setStatus("done");
      refresh();
    } catch (err) {
      setErrorMsg("AI greška: " + (err instanceof Error ? err.message : "Nepoznato"));
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
        {/* Ovde stoji tvoj ostatak interfejsa (dugmad, inputi, prikaz rezultata) */}
        <h1 className="text-2xl font-bold">Skener Dokumenta</h1>
        <button onClick={() => signOut()} className="flex items-center gap-2 mt-4 text-red-500">
            <LogOut size={16} /> Odjava
        </button>
        
        {status === "uploading" && <p>Uploaduje se slika...</p>}
        {status === "analyzing" && <p>AI analizira... molim sačekajte...</p>}
        
        {errorMsg && <p className="text-red-500 font-bold">{errorMsg}</p>}
        
        <input 
            ref={fileInputRef} 
            type="file" 
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
            className="my-4" 
        />
        <button onClick={handleAnalyze} className="bg-blue-600 text-white px-4 py-2 rounded">
            Analiziraj
        </button>
    </div>
  );
}