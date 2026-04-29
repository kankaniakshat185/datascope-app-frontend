"use client";

import { useState, useRef } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import { Settings2, ChevronDown, ChevronUp, UploadCloud, LogOut, X } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rulesJson, setRulesJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (isPending) return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
            <h1 className="text-6xl font-extrabold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
            <div className="flex justify-center gap-1.5">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
            </div>
        </div>
    </div>
  );

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-200 text-black font-sans flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Authentication Required</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-5xl bg-white rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-neutral-100 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-700">
            {/* Left Section: Context */}
            <div className="flex-1 p-12 bg-neutral-900 text-white flex flex-col justify-center">
                <div className="space-y-6">
                    <h2 className="text-6xl font-extrabold tracking-tighter leading-tight">Access <br/>Intelligence</h2>
                    <p className="text-neutral-400 text-lg leading-relaxed max-w-sm">Login or Sign Up to analyze and optimize your datasets with the DataScope engine.</p>
                </div>
            </div>

            {/* Right Section: Form */}
            <div className="flex-1 p-12 flex flex-col justify-center bg-white">
                <div className="space-y-6 max-w-sm mx-auto w-full">
                    <div className="space-y-4">
                        <input 
                            className="w-full p-4 rounded-xl bg-neutral-50 text-black border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-neutral-400 text-sm font-bold" 
                            placeholder="FULL NAME" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                        <input 
                            className="w-full p-4 rounded-xl bg-neutral-50 text-black border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-neutral-400 text-sm font-bold" 
                            placeholder="EMAIL ADDRESS" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                            className="w-full p-4 rounded-xl bg-neutral-50 text-black border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-neutral-400 text-sm font-bold" 
                            type="password" 
                            placeholder="PASSWORD" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <button 
                            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm" 
                            onClick={() => authClient.signIn.email({ email, password })}
                        >
                            LOG IN
                        </button>
                        <button 
                            className="w-full py-4 bg-white border-2 border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-all active:scale-[0.98] text-sm" 
                            onClick={() => authClient.signUp.email({ email, password, name })}
                        >
                            CREATE ACCOUNT
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </main>

        <footer className="p-4 flex justify-end">
           <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-80 hover:opacity-100 transition-opacity">
              Developed by Akshat Kankani
           </span>
        </footer>
      </div>
    );
  }

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (rulesJson.trim() !== "") {
        formData.append("rules", rulesJson);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/results/${data.datasetId}`);
    } else {
      alert("Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-200 text-black font-sans flex flex-col">
      <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-base font-extrabold text-black/80 tracking-tight uppercase">{(session.user.name || session.user.email).toUpperCase()}</span>
          <button className="text-xs font-bold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-all shadow-md active:scale-95 flex items-center gap-2" onClick={() => authClient.signOut()}>
            <LogOut className="w-4 h-4" />
            LOG OUT
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto mt-32 px-6">
        <h2 className="text-5xl font-extrabold mb-4 text-center text-neutral-900 tracking-tight">Intelligent Dataset Analysis</h2>
        <p className="text-neutral-500 mb-10 text-center text-lg leading-relaxed max-w-lg mx-auto">Drop your dataset in to get instant diagnostics, insights, and automated fixes.</p>

        <div className="p-4 bg-white rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-neutral-100 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4 border-2 border-dashed border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all py-2 px-8 rounded-xl group relative overflow-hidden h-16">
            <UploadCloud className="w-8 h-8 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls,.json,.parquet"
              id="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex-1 min-w-0 flex items-center justify-between z-20 pointer-events-none">
                <span className="text-base font-bold text-neutral-600 truncate">
                {file ? file.name : "Choose a dataset (CSV, JSON, Excel...)"}
                </span>
                {file && (
                    <button 
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            handleClearFile(); 
                        }}
                        className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors rounded-md pointer-events-auto"
                        title="Remove file"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>

          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="h-16 px-12 bg-neutral-900 text-white rounded-xl font-bold text-base tracking-wide hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shrink-0 active:scale-95"
          >
            {uploading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        <div className="flex flex-col mt-4">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="flex items-center gap-2 text-sm font-bold text-black hover:text-neutral-700 transition-colors px-2 py-1 ml-auto"
            >
                <Settings2 className="w-4 h-4" />
                Advanced Settings
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvanced && (
                <div className="mt-3 w-full p-8 bg-white border border-neutral-200 rounded-[1.5rem] shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="text-sm font-bold text-neutral-700 flex justify-between items-center mb-1">
                            Custom Rules
                            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 bg-neutral-200 px-2 py-1 rounded-md">JSON</span>
                        </label>
                        <p className="text-xs text-neutral-500 mb-4">
                            Define specific constraints to validate your data. For example, enforce minimum ages, restrict categories, or specify allowed ranges for critical columns.
                        </p>
                    </div>
                    <textarea
                       value={rulesJson}
                       onChange={(e) => setRulesJson(e.target.value)}
                       placeholder={'[\n  { "column": "Age", "type": "min", "value": 0 },\n  { "column": "Status", "type": "in", "value": ["Active", "Inactive"] }\n]'}
                       className="w-full h-32 p-4 text-sm font-mono text-neutral-800 bg-neutral-50 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-neutral-400"
                    />
                </div>
            )}
        </div>
      </main>

      <footer className="p-4 flex justify-end">
         <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-80 hover:opacity-100 transition-opacity">
            Developed by Akshat Kankani
         </span>
      </footer>
    </div>
  );
}
