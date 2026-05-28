"use client";

import { useState, useRef } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import { Settings2, ChevronDown, ChevronUp, UploadCloud, LogOut, X, Info } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rulesJson, setRulesJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profiling, setProfiling] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStage, setJobStage] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Target Selection State
  const [profileData, setProfileData] = useState<any>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [predictionType, setPredictionType] = useState<string>("Auto Detect");
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);

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
    setProfileData(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-200 text-black font-sans flex flex-col">
        <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-blue-100 border-2 border-black rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1),inset_12px_12px_0px_0px_rgba(59,130,246,1)] animate-in fade-in zoom-in duration-500 relative overflow-hidden">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">
                    {isLoginMode ? "Access Scope" : "Join Scope"}
                </h2>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    {isLoginMode ? "Login to start analyzing" : "Signup to start analyzing"}
                </p>
            </div>

            <div className="space-y-4">
                {!isLoginMode && (
                    <input 
                        className="w-full p-4 rounded-none bg-white/50 text-black border-2 border-black outline-none focus:bg-white transition-all placeholder:text-neutral-500 text-sm font-bold uppercase tracking-tight" 
                        placeholder="Full Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                    />
                )}
                <input 
                    className="w-full p-4 rounded-none bg-white/50 text-black border-2 border-black outline-none focus:bg-white transition-all placeholder:text-neutral-500 text-sm font-bold uppercase tracking-tight" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                />
                <input 
                    className="w-full p-4 rounded-none bg-white/50 text-black border-2 border-black outline-none focus:bg-white transition-all placeholder:text-neutral-500 text-sm font-bold uppercase tracking-tight" 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                />
                
                <button 
                    className="w-full py-4 bg-black hover:bg-neutral-800 text-white font-black rounded-none transition-all active:scale-[0.98] text-sm uppercase tracking-[0.2em] shadow-lg" 
                    onClick={() => isLoginMode ? authClient.signIn.email({ email, password }) : authClient.signUp.email({ email, password, name })}
                >
                    {isLoginMode ? "Login" : "Sign Up"}
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-black/10 text-center">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    {isLoginMode ? "Need an account?" : "Already have an account?"}{" "}
                    <button 
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-black hover:underline underline-offset-4 decoration-2"
                    >
                        {isLoginMode ? "Sign up" : "Login"}
                    </button>
                </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleProfileDataset = async () => {
    if (!file) return;
    setProfiling(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setProfileData(data);
      if (data.ranked_candidates && data.ranked_candidates.length > 0) {
        setTargetColumn(data.ranked_candidates[0].column);
      }
      setProfiling(false);
    } catch (e: any) {
      setProfiling(false);
      alert(`Profiling failed: ${e.message}`);
    }
  };

  const handleStartAnalysis = async () => {
    if (!file || !targetColumn) return;
    setUploading(true);
    setJobProgress(10);
    setJobStage("Initializing Human-in-the-Loop Governance...");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);
    formData.append("prediction_type", predictionType);
    formData.append("excluded_columns", JSON.stringify(excludedColumns));

    if (rulesJson.trim() !== "") {
        formData.append("rules", rulesJson);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const { runId, jobId } = data;

      const pollInterval = setInterval(async () => {
        const pollRes = await fetch(`/api/jobs/${runId}?fastApiJobId=${jobId}`);
        if (!pollRes.ok) return;

        const pollData = await pollRes.json();
        
        if (pollData.progress) setJobProgress(pollData.progress);
        if (pollData.stage) setJobStage(pollData.stage);

        if (pollData.status === "COMPLETED") {
          clearInterval(pollInterval);
          setUploading(false);
          router.push(`/results/${pollData.datasetId}`);
        } else if (pollData.status === "FAILED") {
          clearInterval(pollInterval);
          setUploading(false);
          alert(`Analysis failed: ${pollData.error}`);
        }
      }, 1500);

    } catch (e: any) {
      setUploading(false);
      alert(`Analysis start failed: ${e.message}`);
    }
  };

  const toggleExcludeColumn = (col: string) => {
    if (excludedColumns.includes(col)) {
      setExcludedColumns(excludedColumns.filter(c => c !== col));
    } else {
      setExcludedColumns([...excludedColumns, col]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-200 text-black font-sans flex flex-col">
      <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center cursor-pointer group" onClick={() => router.push("/")}>
          <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter group-hover:text-blue-600 transition-colors">DataScope</h1>
        </div>
        <div className="flex items-center gap-8">
          {session && (
            <div className="flex items-center gap-6">
              <span className="text-base font-extrabold text-black/80 tracking-tight uppercase">{(session.user.name || session.user.email).toUpperCase()}</span>
              <div className="h-4 w-[1px] bg-black/10"></div>
              <nav className="flex items-center gap-6">
                 <button onClick={() => router.push("/vault")} className="text-sm font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">Vault</button>
                 <button className="text-sm font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest" onClick={() => authClient.signOut()}>
                   LOGOUT
                 </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto mt-20 px-6 w-full">
        <h2 className="text-5xl font-extrabold mb-4 text-center text-neutral-900 tracking-tight">Beyond the Numbers</h2>
        <p className="text-neutral-500 mb-10 text-center text-lg leading-relaxed max-w-lg mx-auto">Detect what’s broken, discover what matters, and refine what remains.</p>

        {!profileData ? (
            <div className="p-4 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-2 border-black flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-4 border-2 border-dashed border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all py-2 px-8 rounded-[1.5rem] group relative overflow-hidden h-16">
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
                disabled={!file || profiling}
                onClick={handleProfileDataset}
                className="h-16 px-12 bg-neutral-900 text-white rounded-[2.5rem] font-bold text-base tracking-wide hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shrink-0 active:scale-95"
              >
                {profiling ? "Profiling Dataset..." : "Profile Dataset"}
              </button>
            </div>
        ) : (
            <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 shadow-xl relative animate-in slide-in-from-bottom-4 duration-500">
               <button 
                    onClick={handleClearFile} 
                    className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-red-100 text-neutral-500 hover:text-red-600 rounded-full transition-colors"
               >
                   <X className="w-5 h-5" />
               </button>
               
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 border-b-2 border-black pb-4">Select Target Column</h3>
               
               <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-6">
                       <div>
                           <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 uppercase tracking-widest mb-2">
                               Target Column
                               <span className="group relative">
                                   <Info className="w-4 h-4 text-neutral-400 cursor-pointer" />
                                   <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                       The target column is the variable the model attempts to predict. Choosing the wrong target can produce misleading governance, leakage, and explainability results.
                                   </span>
                               </span>
                           </label>
                           <select 
                               className="w-full p-4 bg-neutral-50 border-2 border-black rounded-xl font-bold outline-none"
                               value={targetColumn}
                               onChange={(e) => setTargetColumn(e.target.value)}
                           >
                               <option value="" disabled>Select target...</option>
                               {profileData.columns.map((col: string) => (
                                   <option key={col} value={col}>{col}</option>
                               ))}
                           </select>
                       </div>

                       {targetColumn && (
                           <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                               <p className="text-xs font-black uppercase text-blue-600 mb-2">Confidence & Reasoning</p>
                               {profileData.ranked_candidates.find((c: any) => c.column === targetColumn) ? (
                                   <>
                                      <div className="flex items-center gap-2 mb-2">
                                          <div className="text-3xl font-extrabold text-blue-800">
                                              {Math.round(profileData.ranked_candidates.find((c: any) => c.column === targetColumn).score * 100)}%
                                          </div>
                                      </div>
                                      <ul className="text-sm font-medium text-blue-900 space-y-1 list-disc pl-4">
                                          {profileData.ranked_candidates.find((c: any) => c.column === targetColumn).reason.map((r: string, i: number) => (
                                              <li key={i}>{r}</li>
                                          ))}
                                      </ul>
                                   </>
                               ) : (
                                   <p className="text-sm font-medium text-neutral-500">Manual selection. No specific ML target heuristics triggered.</p>
                               )}
                           </div>
                       )}

                       {targetColumn && profileData.ranked_candidates.find((c: any) => c.column === targetColumn)?.proxies?.length > 0 && (
                           <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                               <p className="text-xs font-black uppercase text-orange-600 mb-2">Potential Target Proxies</p>
                               <ul className="text-sm font-medium text-orange-900 space-y-1 list-disc pl-4">
                                   {profileData.ranked_candidates.find((c: any) => c.column === targetColumn).proxies.map((p: any, i: number) => (
                                       <li key={i}><strong>{p.column}:</strong> {p.reason}</li>
                                   ))}
                               </ul>
                               <p className="text-xs text-orange-700 mt-2 font-bold mb-3">Consider excluding these in the panel on the right.</p>
                               <button 
                                   onClick={() => setExcludedColumns(Array.from(new Set([...excludedColumns, ...profileData.ranked_candidates.find((c: any) => c.column === targetColumn).proxies.map((p: any) => p.column)])))}
                                   className="px-3 py-1.5 bg-orange-200 hover:bg-orange-300 text-orange-900 text-xs font-bold uppercase rounded transition-colors"
                               >
                                   Exclude Proxies Now
                               </button>
                           </div>
                       )}

                       <div>
                           <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 uppercase tracking-widest mb-2">
                               Prediction Type
                               <span className="group relative">
                                   <Info className="w-4 h-4 text-neutral-400 cursor-pointer" />
                                   <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                       Classification predicts categories (e.g. spam/not spam). Regression predicts continuous values (e.g. house prices).
                                   </span>
                               </span>
                           </label>
                           <select 
                               className="w-full p-4 bg-neutral-50 border-2 border-neutral-300 rounded-xl font-bold outline-none"
                               value={predictionType}
                               onChange={(e) => setPredictionType(e.target.value)}
                           >
                               <option value="Auto Detect">Auto Detect</option>
                               <option value="Classification">Classification</option>
                               <option value="Regression">Regression</option>
                           </select>
                       </div>
                   </div>

                   <div>
                       <label className="text-sm font-bold text-neutral-700 uppercase tracking-widest mb-2 block">
                           Exclude Features (Optional)
                       </label>
                       <p className="text-xs text-neutral-500 mb-4 font-medium">Select columns to completely ignore (e.g. IDs, names, direct target proxies).</p>
                       <div className="h-64 overflow-y-auto border border-neutral-200 rounded-xl p-2 bg-neutral-50 space-y-1">
                           {[...profileData.columns]
                               .filter((c: string) => c !== targetColumn)
                               .sort((a: string, b: string) => {
                                   const proxies = profileData.ranked_candidates.find((c: any) => c.column === targetColumn)?.proxies || [];
                                   const aIsProxy = proxies.some((p: any) => p.column === a) ? 1 : 0;
                                   const bIsProxy = proxies.some((p: any) => p.column === b) ? 1 : 0;
                                   return bIsProxy - aIsProxy; // Proxies float to top
                               })
                               .map((col: string) => (
                               <label key={col} className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded cursor-pointer">
                                   <input 
                                       type="checkbox" 
                                       checked={excludedColumns.includes(col)}
                                       onChange={() => toggleExcludeColumn(col)}
                                       className="w-4 h-4 accent-black"
                                   />
                                   <span className="text-sm font-medium">{col}</span>
                               </label>
                           ))}
                       </div>
                   </div>
               </div>

               <div className="mt-8 pt-6 border-t-2 border-black flex justify-end">
                   <button
                    disabled={!targetColumn || uploading}
                    onClick={handleStartAnalysis}
                    className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                   >
                     {uploading ? "Initializing Governance..." : "Initialize ML Governance"}
                   </button>
               </div>
            </div>
        )}

        {/* Progress Modal Overlay */}
        {uploading && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white border-2 border-black rounded-[2rem] p-10 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 relative overflow-hidden">
                 
                 <div className="absolute top-0 left-0 w-full h-2 bg-neutral-100">
                    <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${jobProgress}%` }}></div>
                 </div>

                 <h3 className="text-3xl font-black uppercase tracking-tighter">Validating Run</h3>
                 
                 <div className="flex justify-center gap-2 mb-4">
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                 </div>

                 <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
                    <p className="text-sm font-bold text-neutral-600 uppercase tracking-wider">{jobStage || "Initializing job..."}</p>
                    <p className="text-xs text-neutral-400 mt-2 font-medium">Please do not close this window.</p>
                 </div>
              </div>
           </div>
        )}
      </main>

      <footer className="p-4 flex justify-end">
         <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-80 hover:opacity-100 transition-opacity">
            Developed by Akshat Kankani
         </span>
      </footer>
    </div>
  );
}
