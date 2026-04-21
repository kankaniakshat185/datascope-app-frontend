"use client";

import { useEffect, useState, ReactNode } from "react";
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

const MetricChart = ({ baseline, after, metric }: { baseline: number; after: number; metric: string }) => {
    const safeBaseline = Math.max(0, baseline);
    const safeAfter = Math.max(0, after);
    const maxVal = Math.max(safeBaseline, safeAfter, 0.001) * 1.05;
    
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const baselineWidth = mounted ? `${(safeBaseline / maxVal) * 100}%` : "0%";
    const afterWidth = mounted ? `${(safeAfter / maxVal) * 100}%` : "0%";

    return (
        <div className="mt-2 flex flex-col gap-3 py-2">
             <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-end">
                     <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Before ({metric})</span>
                     <span className="font-mono text-sm font-semibold text-neutral-700">{baseline.toFixed(3)}</span>
                 </div>
                 <div className="w-full bg-neutral-100 rounded-full h-2.5 shadow-inner overflow-hidden border border-neutral-200">
                     <div 
                        className="bg-neutral-400 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: baselineWidth }}
                     />
                 </div>
             </div>
             <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-end">
                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">After ({metric})</span>
                     <span className="font-mono text-sm font-bold text-emerald-600">{after.toFixed(3)}</span>
                 </div>
                 <div className="w-full bg-neutral-100 rounded-full h-2.5 shadow-inner overflow-hidden border border-emerald-100">
                     <div 
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)] relative overflow-hidden" 
                        style={{ width: afterWidth }}
                     >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const GLOSSARY = [
  {
    regex: /\b(rmse|root mean square error)\b/i,
    term: "RMSE",
    url: "https://www.geeksforgeeks.org/root-mean-square-error-in-machine-learning/",
    tooltip: "Root Mean Square Error: evaluates the standard deviation of the residuals."
  },
  {
    regex: /\b(iqr|interquartile range)\b/i,
    term: "IQR",
    url: "https://www.geeksforgeeks.org/interquartile-range-to-detect-outliers-in-data/",
    tooltip: "Interquartile Range: robust statistical measure used to detect outliers."
  },
  {
    regex: /\b(z-score|z\s?score)\b/i,
    term: "Z-Score",
    url: "https://www.geeksforgeeks.org/z-score-for-outlier-detection-python/",
    tooltip: "Z-Score indicates how many standard deviations an element is from the mean."
  },
  {
    regex: /\b(missing value|missing values|imputation|impute)\b/i,
    term: "Handling Missing Data",
    url: "https://www.geeksforgeeks.org/working-with-missing-data-in-pandas/",
    tooltip: "Techniques to handle or fill blank data points in your dataset."
  },
  {
    regex: /\b(outlier|outliers)\b/i,
    term: "Outliers",
    url: "https://www.geeksforgeeks.org/detect-and-remove-the-outliers-using-python/",
    tooltip: "Data points that differ significantly from other observations."
  },
  {
    regex: /\b(one-hot encoding|one hot encoding|ohe)\b/i,
    term: "One-Hot Encoding",
    url: "https://www.geeksforgeeks.org/ml-one-hot-encoding-of-datasets-in-python/",
    tooltip: "Converting categorical data into binary vectors."
  },
  {
    regex: /\b(label encoding)\b/i,
    term: "Label Encoding",
    url: "https://www.geeksforgeeks.org/ml-label-encoding-of-datasets-in-python/",
    tooltip: "Converting each categorical value to a unique integer."
  },
  {
    regex: /\b(standard scaling|standardization|standard scaler)\b/i,
    term: "Standardization",
    url: "https://www.geeksforgeeks.org/standardscaler-minmaxscaler-and-robustscaler-techniques-ml/",
    tooltip: "Transforming data to have mean=0 and variance=1."
  },
  {
    regex: /\b(min-max scaling|min max scaler|normalization)\b/i,
    term: "Normalization",
    url: "https://www.geeksforgeeks.org/data-normalization-in-data-mining/",
    tooltip: "Scaling data to a specific range, usually 0 to 1."
  },
  {
    regex: /\b(accuracy|r-squared|r2|mae|mse|mean absolute error|mean squared error)\b/i,
    term: "Evaluation Metrics",
    url: "https://www.geeksforgeeks.org/machine-learning-model-evaluation/",
    tooltip: "Measures used to assess a model's performance."
  }
];

const GlossaryTerm = ({ term, url, tooltip, children }: { term: string, url: string, tooltip: string, children: ReactNode }) => {
    return (
        <span className="relative group inline-block">
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline decoration-dashed decoration-blue-400 text-blue-600 font-bold cursor-pointer transition-colors hover:text-blue-500 hover:decoration-blue-500 mx-0.5"
            >
                {children}
            </a>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <span className="block bg-neutral-900 text-white text-xs p-2.5 rounded-xl shadow-xl shadow-blue-900/10 text-center relative border border-neutral-700">
                    <span className="block font-bold text-blue-300 mb-1">{term}</span>
                    <span className="block text-neutral-300 whitespace-normal leading-relaxed">{tooltip}</span>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900"></span>
                </span>
            </span>
        </span>
    );
};

const RichText = ({ content }: { content: string }) => {
    let parts: (string | ReactNode)[] = [content];

    GLOSSARY.forEach((item, index) => {
        parts = parts.flatMap((part, i) => {
            if (typeof part !== 'string') return [part];
            
            const words = part.split(item.regex);
            if (words.length === 1) return [part];

            return words.map((word, wIdx) => {
                if (wIdx % 2 === 1) { 
                    return (
                        <GlossaryTerm key={`${index}-${i}-${wIdx}`} term={item.term} url={item.url} tooltip={item.tooltip}>
                            {word}
                        </GlossaryTerm>
                    );
                }
                return word;
            });
        });
    });

    return <>{parts.map((part, i) => <span key={i}>{part}</span>)}</>;
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
            <h1 className="text-3xl font-bold text-black text-center font-playfair">DataScope</h1>
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
                        <h3 className="text-xl font-semibold mb-1"><RichText content={issue.description} /></h3>
                        <p className="text-sm">→ Fix: <span className=" font-medium"><RichText content={issue.suggestion} /></span></p>
                    </div>
                </div>

                {/* Right side: Impact Metric */}
                <div className="flex flex-col gap-3 bg-white border p-4 rounded-xl shadow-inner min-w-[280px]">
                    <div className={`text-center ${issue.rawJson?.metric ? 'pb-3 border-b border-neutral-200' : ''}`}>
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
                        <MetricChart baseline={issue.rawJson.baseline_score} after={issue.rawJson.after_score} metric={issue.rawJson.metric} />
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
