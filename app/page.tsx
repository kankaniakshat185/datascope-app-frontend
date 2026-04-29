"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import { Settings2, ChevronDown, ChevronUp, UploadCloud, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rulesJson, setRulesJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  if (isPending) return <div className="p-10 text-white min-h-screen bg-neutral-500">Loading...</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center text-black min-h-screen bg-neutral-100 text-white">
        <div className="p-8 bg-neutral-200 rounded-2xl shadow-2xl w-96 space-y-4">
          <h1 className="text-4xl font-bold text-black text-center font-archivo uppercase tracking-tighter">DataScope</h1>
          <p className="text-sm text-black">Login or Signup to continue</p>
          <input className="w-full p-2.5 rounded-lg bg-neutral-300 text-black outline-none focus:border-blue-500" placeholder="Name (for signup)" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full p-2.5 rounded-lg bg-neutral-300 text-black outline-none focus:border-blue-500" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-2.5 rounded-lg bg-neutral-300 text-black outline-none focus:border-blue-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-green-600 hover:bg-green-500 text-sm font-medium p-2.5 rounded-lg transition-colors" onClick={() => authClient.signIn.email({ email, password })}>Login</button>
            <button className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-sm font-medium p-2.5 rounded-lg transition-colors" onClick={() => authClient.signUp.email({ email, password, name })}>Sign Up</button>
          </div>
        </div>
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
    <div className="min-h-screen bg-neutral-200 text-black font-sans">
      <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">{session.user.email}</span>
          <button className="text-sm font-semibold bg-neutral-800 text-white px-4 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors shadow-sm" onClick={() => authClient.signOut()}>LOG OUT</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto mt-32 px-6">
        <h2 className="text-4xl font-bold mb-4 text-center text-neutral-900 tracking-tight">Intelligent Dataset Analysis</h2>
        <p className="text-neutral-500 mb-10 text-center text-base leading-relaxed max-w-lg mx-auto">Drop your dataset in to get instant diagnostics, insights, and automated fixes.</p>

        <div className="p-3 bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-neutral-100 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3 border-2 border-dashed border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors py-2 px-6 rounded-2xl group cursor-pointer relative overflow-hidden h-14">
            <UploadCloud className="w-6 h-6 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.parquet"
              id="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <span className="text-sm font-semibold text-neutral-600 truncate z-0">
              {file ? file.name : "Choose a dataset (CSV, JSON, Excel...)"}
            </span>
          </div>

          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="h-14 px-10 bg-neutral-900 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shrink-0"
          >
            {uploading ? "Analyzing..." : "Run Debugger"}
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
                <div className="mt-3 w-full p-8 bg-white border border-neutral-200 rounded-[2rem] shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                       className="w-full h-32 p-4 text-sm font-mono text-neutral-800 bg-neutral-50 rounded-2xl border border-neutral-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-neutral-400"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
