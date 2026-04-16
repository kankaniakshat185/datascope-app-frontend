"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  if (isPending) return <div className="p-10 text-white min-h-screen bg-neutral-950">Loading...</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-96 space-y-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Dataset Debugger</h1>
          <p className="text-neutral-400 text-sm">Login or Signup to continue</p>
          <input className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 outline-none focus:border-blue-500" placeholder="Name (for signup)" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 outline-none focus:border-blue-500" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 outline-none focus:border-blue-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-sm font-medium p-2.5 rounded-lg transition-colors" onClick={() => authClient.signIn.email({ email, password })}>Login</button>
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
    <div className="min-h-screen bg-neutral-950 text-white p-10 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Dataset Debugger</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{session.user.email}</span>
          <button className="text-sm text-neutral-400 hover:text-white transition-colors" onClick={() => authClient.signOut()}>Sign Out</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-32 p-10 border border-neutral-800 rounded-3xl bg-neutral-900/40 shadow-2xl backdrop-blur-xl">
        <h2 className="text-2xl font-semibold mb-2">Analyze a New Dataset</h2>
        <p className="text-neutral-400 mb-8 leading-relaxed">Find out exactly why your model sucks. Upload a CSV to get an instant analysis on data quality and machine learning metrics with quantified improvements.</p>

        <div className="flex flex-col gap-6">
          <div className="border border-dashed border-neutral-700 p-8 rounded-xl bg-neutral-900/50 flex justify-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>
          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="w-full bg-gradient-to-r w-full from-emerald-600 to-teal-600 text-white p-3.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg"
          >
            {uploading ? "Analyzing Impact Metrics..." : "Run Debugger"}
          </button>
        </div>
      </div>
    </div>
  );
}
