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

  if (isPending) return <div className="p-10 text-white min-h-screen bg-neutral-500">Loading...</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center text-black min-h-screen bg-neutral-100 text-white">
        <div className="p-8 bg-neutral-200 rounded-2xl shadow-2xl w-96 space-y-4">
          <h1 className="text-4xl font-bold text-black text-center font-playfair">Dataset Debugger</h1>
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
    <div className="min-h-screen bg-neutral-200 text-black font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-10 p-6 border-b-4 border-black">
        <div className="flex items-center gap-4 invisible">
          <span className="text-sm">{session.user.email}</span>
          <button className="text-sm hover:text-white transition-colors" onClick={() => authClient.signOut()}>Sign Out</button>
        </div>
        <h1 className="text-4xl font-bold text-black text-center font-playfair">Dataset Debugger</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{session.user.email}</span>
          <button className="text-sm hover:text-white transition-colors" onClick={() => authClient.signOut()}>Sign Out</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-32 p-10 rounded-3xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-2xl font-semibold mb-2 text-center">Analyze a New Dataset</h2>
        <p className="text-black mb-8 leading-relaxed">Upload your CSV to receive a comprehensive evaluation of data quality and model performance. Identify key issues, understand their impact, and get actionable recommendations for improvement.</p>

        <div className="flex flex-col gap-6">
          <div className="border border-dashed p-4 rounded-xl bg-neutral-400/20 flex justify-center">
            <input
              type="file"
              accept=".csv"
              id="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>
          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="w-full bg-blue-500 text-white p-3.5 rounded-xl font-medium disabled:cursor-not-allowed hover:bg-blue-400 transition-all shadow-lg"
          >
            {uploading ? "Analyzing Impact Metrics..." : "Run Debugger"}
          </button>
        </div>
      </div>
    </div>
  );
}
