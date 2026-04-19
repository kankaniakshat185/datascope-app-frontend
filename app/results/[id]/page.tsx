"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle, Activity } from "lucide-react";

type Issue = {
  id: string;
  issueType: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  suggestion: string;
  impactScore: string;
  rawJson?: {
    baseline_score?: number;
    after_score?: number;
    metric?: string;
    confidence_score?: number;
    eval_metrics?: any;
    [key: string]: any;
  };
};

type DatasetResult = {
  id: string;
  fileName: string;
  uploadedAt: string;
  analysisResults: Issue[];
};

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<DatasetResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analysis/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d) => {
        setData(d.dataset);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-neutral-400 flex items-center justify-center text-white">Loading analysis results...</div>;
  if (!data) return <div className="min-h-screen bg-neutral-400 flex items-center justify-center text-white">Analysis not found. Make sure you are logged in.</div>;

  const severityIcon = {
    HIGH: <AlertCircle className="w-6 h-6 text-red-500" />,
    MEDIUM: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    LOW: <CheckCircle className="w-6 h-6 text-blue-500" />,
  };

  const severityBg = {
    HIGH: "bg-red-500/10 border-red-500/20",
    MEDIUM: "bg-yellow-500/10 border-yellow-500/20",
    LOW: "bg-green-500/10 border-green-500/20",
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-black font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b-4 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-neutral-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-black text-center font-playfair">Dataset Debugger</h1>
          </div>
          <div className="text-md text-black">
            Analyzing: <span className="">{data.fileName}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Your dataset determines your model’s performance.</h2>
            <p className="text-lg max-w-2xl mx-auto">
                We found <span className="text-red-500 font-bold">{data.analysisResults.length}</span> critical issues. 
                Applying the suggested fixes will demonstrably improve your baseline model.
            </p>
        </div>

        <div className="space-y-6">
          {data.analysisResults.map((issue) => (
            <div key={issue.id} className={`p-6 rounded-2xl border ${severityBg[issue.severity]} backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:-translate-y-1 hover:shadow-xl`}>
                
                {/* Left side: Icon & Details */}
                <div className="flex gap-5 items-start">
                    <div className="pt-1">
                        {severityIcon[issue.severity]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {issue.severity} PRIORITY
                            </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-1">{issue.description}</h3>
                        <p className="text-sm">→ Fix: <span className=" font-medium">{issue.suggestion}</span></p>
                    </div>
                </div>

                {/* Right side: Impact Metric */}
                <div className="flex flex-col gap-3 bg-white border p-4 rounded-xl shadow-inner min-w-[280px]">
                    <div className={`text-center ${issue.rawJson?.metric ? 'pb-3 border-b border-neutral-800' : ''}`}>
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-semibold tracking-wider uppercase">Projected Impact</span>
                        </div>
                        <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            {issue.impactScore}
                        </div>
                        {issue.rawJson?.confidence_score !== undefined && (
                            <div className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">
                                Confidence: {issue.rawJson.confidence_score.toFixed(1)}%
                            </div>
                        )}
                    </div>
                    {issue.rawJson?.metric && issue.rawJson?.baseline_score !== undefined && issue.rawJson?.after_score !== undefined && (
                        <div className="flex justify-between items-center text-sm px-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{issue.rawJson.metric} (Before)</span>
                                <span className="font-mono text-neutral-300">{Number(issue.rawJson.baseline_score).toFixed(3)}</span>
                            </div>
                            <div className="text-neutral-600">→</div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider">{issue.rawJson.metric} (After)</span>
                                <span className="font-mono text-emerald-400">{Number(issue.rawJson.after_score).toFixed(3)}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
          ))}

          {data.analysisResults.length === 0 && (
             <div className="text-center py-20 border border-neutral-800 rounded-3xl bg-neutral-900/30">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold">Your dataset looks great!</h3>
                <p className="text-neutral-400 mt-2">No critical machine learning or structural issues found.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
