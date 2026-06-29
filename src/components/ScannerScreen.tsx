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
      setErrorMsg("Greška pri uploadu slike.");
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
          "Authorization": "Bearer" + import.meta.env.VITE_OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `Prevedi ovaj dokument na ${selectedLanguage === 'sr' ? 'srpski' : selectedLanguage === 'hr' ? 'hrvatski' : 'bosanski'} jezik i daj kratak sažetak. Vrati odgovor u JSON formatu sa poljima: translated_text i summary.` },
                { type: "image_url", image_url: { url: imagePreview } }
              ]
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) throw new Error("Neuspešna veza sa AI servisom. Proverite API ključ.");

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      await supabase.from("scans").insert({
        image_url: imagePreview,
        target_language: selectedLanguage,
        translated_text: content.translated_text,
        summary: content.summary,
      });

      setResult(content);
      setStatus("done");
      refresh();
    } catch (err) {
      setErrorMsg("AI analysis failed: " + (err instanceof Error ? err.message : "Nepoznata greška"));
      setStatus("error");
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setUploadedPath(null);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ... ostatak tvog JSX-a ostaje isti ... */}
      {/* Samo proveri da li je input tag unutar Upload area ovako postavljen: */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleFileInput}
        className="hidden"
      />
      {/* ... ostatak koda ... */}
    </div>
  );
}