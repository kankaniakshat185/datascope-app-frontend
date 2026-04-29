"use client";

import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Database, 
  Search, 
  Calendar, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  LogOut,
  ArrowLeft,
  Clock,
  LayoutGrid,
  Filter
} from "lucide-react";

export default function VaultPage() {
  const { data: session, isPending } = authClient.useSession();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
      return;
    }

    if (session) {
      fetch("/api/vault")
        .then(res => res.json())
        .then(data => {
          setDatasets(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [session, isPending, router]);

  if (isPending || loading) return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
            <h1 className="text-6xl font-extrabold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
            <div className="flex justify-center gap-1.5">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] animate-in fade-in duration-1000">Accessing The Vault</p>
        </div>
    </div>
  );

  const filteredDatasets = datasets.filter(d => 
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-100 text-black font-sans flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center">
          <button onClick={() => router.push("/")} className="mr-4 text-neutral-800 hover:text-black transition flex items-center justify-center bg-white/50 p-1.5 rounded-md hover:bg-white/80 border border-black/5 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
        </div>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-6">
             <button onClick={() => router.push("/")} className="text-sm font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">Analyzer</button>
             <button onClick={() => router.push("/vault")} className="text-sm font-bold text-black transition-colors uppercase tracking-widest">Vault</button>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-base font-extrabold text-black/80 tracking-tight uppercase">{(session?.user.name || session?.user.email || "").toUpperCase()}</span>
            <button className="text-sm font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest" onClick={() => authClient.signOut()}>
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 pb-10">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight text-neutral-900 mb-2 flex items-center gap-4">
               <Database className="w-12 h-12 text-blue-500" />
               The Vault
            </h2>
            <p className="text-neutral-500 text-lg font-medium">Access and audit your historical dataset analysis reports.</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Search dataset history..."
               className="w-full bg-white border border-neutral-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {filteredDatasets.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border-2 border-dashed border-neutral-200 p-24 text-center">
             <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-neutral-300" />
             </div>
             <h3 className="text-2xl font-bold text-neutral-800 mb-2">No historical data found</h3>
             <p className="text-neutral-500 max-w-sm mx-auto font-medium">
                {searchTerm ? `No results matching "${searchTerm}"` : "You haven't analyzed any datasets yet. Head back to the analyzer to start your first audit."}
             </p>
             {!searchTerm && (
                <button 
                  onClick={() => router.push("/")}
                  className="mt-8 px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-black/5"
                >
                  START FIRST ANALYSIS
                </button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredDatasets.map((d) => {
              const highIssues = d.analysisResults?.filter((r: any) => r.severity === "HIGH").length || 0;
              const mediumIssues = d.analysisResults?.filter((r: any) => r.severity === "MEDIUM").length || 0;
              
              return (
                <div 
                  key={d.id} 
                  onClick={() => router.push(`/results/${d.id}`)}
                  className="bg-white rounded-[1.5rem] border border-neutral-200 p-8 cursor-pointer group hover:border-blue-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                       <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                          <FileText className="w-6 h-6 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                       </div>
                       <div className="flex gap-1.5">
                          {highIssues > 0 && (
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-md border border-red-100 uppercase">{highIssues} High</span>
                          )}
                          {mediumIssues > 0 && (highIssues === 0) && (
                            <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-black rounded-md border border-yellow-100 uppercase">{mediumIssues} Med</span>
                          )}
                       </div>
                    </div>

                    <h4 className="text-xl font-bold text-neutral-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{d.fileName}</h4>
                    
                    <div className="space-y-3 pt-4 border-t border-black/5">
                       <div className="flex items-center gap-2 text-neutral-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                       </div>
                       <div className="flex items-center gap-2 text-neutral-400">
                          <LayoutGrid className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{d.analysisResults?.length || 0} Modules Analyzed</span>
                       </div>
                    </div>

                    <div className="mt-8 flex items-center text-blue-500 font-bold text-sm gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                       VIEW FULL REPORT
                       <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
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
