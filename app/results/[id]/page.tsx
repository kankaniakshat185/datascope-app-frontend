"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle, Activity, Database, BarChart3, Sparkles, GitBranch, LogOut, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ScatterChart, Scatter, ZAxis, Cell } from "recharts";

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
  },
  {
    regex: /\b(multicollinearity|collinear|collinearity)\b/i,
    term: "Multicollinearity",
    url: "https://www.geeksforgeeks.org/multicollinearity-in-data/",
    tooltip: "When independent variables in a model are highly correlated with each other."
  },
  {
    regex: /\b(dropping columns|drop columns|drop feature|dropping feature)\b/i,
    term: "Dropping Columns",
    url: "https://www.geeksforgeeks.org/how-to-drop-one-or-multiple-columns-in-pandas-dataframe/",
    tooltip: "Removing unnecessary, redundant, or highly missing columns to improve model efficiency."
  },
  {
    regex: /\b(uniqueness|unique values|cardinality)\b/i,
    term: "Uniqueness / Cardinality",
    url: "https://www.geeksforgeeks.org/python-pandas-series-nunique/",
    tooltip: "The count of distinct values. High cardinality can lead to overfitting or memory issues."
  },
  {
    regex: /\b(vif|variance inflation factor)\b/i,
    term: "Variance Inflation Factor (VIF)",
    url: "https://www.geeksforgeeks.org/detecting-multicollinearity-with-vif-python/",
    tooltip: "A measure used to detect the severity of multicollinearity in regression analysis."
  },
  {
    regex: /\b(correlation|correlation matrix|pearson)\b/i,
    term: "Correlation Matrix",
    url: "https://www.geeksforgeeks.org/create-a-correlation-matrix-using-pandas/",
    tooltip: "A table showing correlation coefficients between variables."
  },
  {
    regex: /\b(imbalance|imbalanced data|class imbalance|smote)\b/i,
    term: "Class Imbalance",
    url: "https://www.geeksforgeeks.org/ml-handling-imbalanced-data-with-smote-and-near-miss-algorithm-in-python/",
    tooltip: "When the distribution of target classes is highly skewed, which can bias the model."
  },
  {
    regex: /\b(skewness|skewed|high skew)\b/i,
    term: "Skewness",
    url: "https://www.geeksforgeeks.org/how-to-calculate-skewness-and-kurtosis-in-python/",
    tooltip: "A measure of the asymmetry of the probability distribution."
  },
  {
    regex: /\b(target leakage|data leakage)\b/i,
    term: "Data Leakage",
    url: "https://www.geeksforgeeks.org/data-leakage-in-machine-learning/",
    tooltip: "When information from outside the training dataset is used to create the model."
  },
  {
    regex: /\b(cross-validation|cross validation|cv)\b/i,
    term: "Cross-Validation",
    url: "https://www.geeksforgeeks.org/cross-validation-machine-learning/",
    tooltip: "A resampling procedure used to evaluate machine learning models on a limited data sample."
  },
  {
    regex: /\b(psi|population stability index)\b/i,
    term: "PSI",
    url: "https://www.geeksforgeeks.org/data-science/population-stability-index-psi/",
    tooltip: "Population Stability Index: measures how much the distribution of a variable has shifted between two datasets."
  },
  {
    regex: /\b(shap|shapley additive explanations)\b/i,
    term: "SHAP",
    url: "https://www.geeksforgeeks.org/machine-learning/shap-a-comprehensive-guide-to-shapley-additive-explanations/",
    tooltip: "SHAP Values: a game theoretic approach to explain the output of any machine learning model."
  },
  {
    regex: /\b(eda|exploratory data analysis)\b/i,
    term: "EDA",
    url: "https://www.geeksforgeeks.org/exploratory-data-analysis-in-python/",
    tooltip: "EDA is the process of analyzing datasets to summarize their main characteristics, often with visual methods."
  },
  {
    regex: /\b(data drift|drift detection|drifted)\b/i,
    term: "Data Drift",
    url: "https://www.geeksforgeeks.org/data-drift-in-machine-learning/",
    tooltip: "Data Drift refers to the change in the distribution of data over time, which can degrade model performance."
  },
  {
    regex: /\b(random forest)\b/i,
    term: "Random Forest",
    url: "https://www.geeksforgeeks.org/random-forest-regression-in-python/",
    tooltip: "An ensemble learning method that operates by constructing a multitude of decision trees."
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
    let parts: any[] = [content];

    GLOSSARY.forEach((item, index) => {
        parts = parts.flatMap((part: any, i: number) => {
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
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<DatasetResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issues' | 'dictionary' | 'eda' | 'remediation' | 'drift' | 'layer1'>('issues');
  const [edaView, setEdaView] = useState<'numerical' | 'categorical' | 'outlier' | 'correlation'>('numerical');
  const [cleaning, setCleaning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driftLoading, setDriftLoading] = useState(false);
  const [driftResults, setDriftResults] = useState<any>(null);
  const driftRefInput = useRef<HTMLInputElement>(null);
  const driftTestInput = useRef<HTMLInputElement>(null);
  const [driftRefFile, setDriftRefFile] = useState<File | null>(null);
  const [driftTestFile, setDriftTestFile] = useState<File | null>(null);
  const [pipelineConfig, setPipelineConfig] = useState<any[]>([
    { id: "0", step: "drop_missing", params: { threshold: 0.5 } },
    { id: "1", step: "impute_missing", params: { strategy: "median" } },
    { id: "2", step: "remove_outliers", params: { threshold: 0.6 } },
    { id: "3", step: "encode_categorical", params: { strategy: "one_hot" } },
    { id: "4", step: "scale_features", params: { method: "standard" } }
  ]);

  const toggleStep = (id: string) => {
      setPipelineConfig(prev => {
          const newConfig = [...prev];
          const stepIndex = newConfig.findIndex(s => s.id === id);
          if (stepIndex > -1) {
              newConfig.splice(stepIndex, 1);
          } else {
              if (id === "0") newConfig.push({ id: "0", step: "drop_missing", params: { threshold: 0.5 } });
              if (id === "1") newConfig.push({ id: "1", step: "impute_missing", params: { strategy: "median" } });
              if (id === "2") newConfig.push({ id: "2", step: "remove_outliers", params: { threshold: 0.6 } });
              if (id === "3") newConfig.push({ id: "3", step: "encode_categorical", params: { strategy: "one_hot" } });
              if (id === "4") newConfig.push({ id: "4", step: "scale_features", params: { method: "standard" } });
          }
          return newConfig.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      });
  };

  const handleRunDrift = async () => {
      if (!driftRefFile || !driftTestFile) return;
      
      setDriftLoading(true);
      try {
          const formData = new FormData();
          formData.append("reference_file", driftRefFile);
          formData.append("test_file", driftTestFile);
          
          const res = await fetch(`/api/drift`, {
              method: "POST",
              body: formData,
          });
          
          if (!res.ok) throw new Error("Drift analysis failed");
          
          const result = await res.json();
          setDriftResults(result);
      } catch (err) {
          console.error(err);
          alert("Failed to analyze data drift.");
      } finally {
          setDriftLoading(false);
      }
  };

  const handleClean = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setCleaning(true);
      try {
          const formData = new FormData();
          formData.append("file", file);
          const cleanConfig = pipelineConfig.map(({ step, params }) => ({ step, params }));
          formData.append("config_json", JSON.stringify(cleanConfig));
          
          const res = await fetch(`/api/clean`, {
              method: "POST",
              body: formData,
          });
          
          if (!res.ok) throw new Error("Cleaning failed");
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cleaned_${file.name.endsWith('.csv') ? file.name : file.name.split('.')[0] + '.csv'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (err) {
          console.error(err);
          alert("Failed to clean dataset. Please make sure the ML service is running.");
      } finally {
          setCleaning(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

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

  if (loading) return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
            <h1 className="text-6xl font-extrabold text-black font-archivo uppercase tracking-tighter">DataScope</h1>
            <div className="flex justify-center gap-1.5">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] animate-in fade-in duration-1000">Analyzing Dataset Intelligence</p>
        </div>
    </div>
  );
  if (!data) return <div className="min-h-screen bg-neutral-400 flex items-center justify-center text-white">Analysis not found. Make sure you are logged in.</div>;

  const dataDictResult = data.analysisResults.find((i: Issue) => i.issueType === "DATA_DICTIONARY");
  const edaResult = data.analysisResults.find((i: Issue) => i.issueType === "EDA_DATA");
  const edaData = edaResult?.rawJson as any;
  const shapResult = data.analysisResults.find((i: Issue) => i.issueType === "SEGMENTED_SHAP_DATA" || i.issueType === "SHAP_DATA");
  const shapData = shapResult?.rawJson as any;
  const layer1Result = data.analysisResults.find((i: Issue) => i.issueType === "LAYER1_ENGINE");
  const layer1Data = layer1Result?.rawJson as any;
  const actualIssues = data.analysisResults.filter((i: Issue) => !["DATA_DICTIONARY", "EDA_DATA", "SHAP_DATA", "SEGMENTED_SHAP_DATA", "LAYER1_ENGINE"].includes(i.issueType));

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
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Print-only Report Header */}
      <div className="hidden print:block p-10 space-y-8 bg-white min-h-screen">
          <div className="flex justify-between items-start border-b-2 border-black pb-8">
              <div>
                  <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">DataScope Intelligence Report</h1>
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs italic">Confidential Data Audit • {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                  <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Dataset Source</p>
                  <p className="text-xl font-bold">{data.fileName}</p>
              </div>
          </div>

          <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  Detected Data Issues
              </h2>
              <div className="grid grid-cols-1 gap-6">
                  {actualIssues.map((issue: Issue) => (
                      <div key={issue.id} className="p-6 border border-neutral-200 rounded-xl bg-neutral-50 break-inside-avoid">
                          <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-bold">{issue.issueType.replace(/_/g, ' ')}</h3>
                              <span className={`px-2 py-1 text-[10px] font-black rounded border ${
                                  issue.severity === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                                  issue.severity === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>{issue.severity}</span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-4 font-medium leading-relaxed">{issue.description}</p>
                          <div className="p-3 bg-white border border-neutral-100 rounded-lg">
                              <p className="text-[10px] font-black uppercase text-neutral-400 mb-1">Recommended Remediation</p>
                              <p className="text-xs font-bold text-neutral-800">{issue.suggestion}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="pt-20 text-center border-t border-neutral-100">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.5em]">End of Report • DataScope Engine</p>
          </div>
      </div>

      {/* Header */}
      <header className="no-print flex justify-between items-center px-8 py-5 border-b-4 border-black bg-blue-100 sticky top-0 z-[100] shadow-sm">
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
                 <button 
                   className="text-sm font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest" 
                   onClick={() => authClient.signOut()}
                 >
                   LOGOUT
                 </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="no-print w-full flex justify-between items-center px-8 pt-4">
          <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                  Analyzing: <span className="text-black font-black">{data.fileName}</span>
              </span>
          </div>
          <button 
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-5 py-2.5 text-black hover:text-blue-600 transition-all active:scale-95 group"
          >
              <FileDown className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Download Report</span>
          </button>
      </div>

      {/* Main Content */}
      <main className="no-print max-w-7xl mx-auto p-12 pt-0">
        <div className="flex flex-wrap gap-4 justify-center mb-16 text-center">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-neutral-900 w-full">Your dataset determines your model’s performance.</h2>
            <p className="text-lg max-w-3xl mx-auto mb-6 text-neutral-600 leading-relaxed">
                Use the interactive tabs below to diagnose critical quality issues, explore feature distributions, and apply automated remediations to prepare your data for production-grade machine learning.
            </p>
        </div>
        <div className="hidden">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleClean} accept=".csv,.xlsx,.xls,.json,.parquet" />
        </div>

        <div className="flex justify-center mb-10">
          <div className="bg-neutral-200/50 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner border border-neutral-200">
            <button 
              onClick={() => setActiveTab('issues')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'issues' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Detected Issues ({actualIssues.length})
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('layer1')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'layer1' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Deep Analytics
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('dictionary')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'dictionary' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Dictionary
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('eda')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'eda' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                EDA Dashboard
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('remediation')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'remediation' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Auto Clean
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('drift')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'drift' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black hover:bg-white/50'}`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Drift Detection
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'dictionary' && dataDictResult && dataDictResult.rawJson && (
          <div className="p-12 pt-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition">
                <div className="text-center mb-10">
                    <Database className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold mb-4">Data Dictionary</h3>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-6 leading-relaxed w-full">
                        <RichText content="The Data Dictionary provides a comprehensive overview of your dataset's structure. It highlights data types, detects missing values, and calculates key statistics for every column, helping you understand the shape and quality of your raw data at a glance." />
                    </p>
                </div>
             <div className="flex gap-4 mb-8 justify-center">
                <div className="bg-blue-50 text-blue-800 px-6 py-2.5 rounded-2xl border border-blue-200 shadow-sm font-semibold">
                   <span className="font-bold text-xl mr-2">{dataDictResult.rawJson.total_rows}</span> Rows
                </div>
                <div className="bg-purple-50 text-purple-800 px-6 py-2.5 rounded-2xl border border-purple-200 shadow-sm font-semibold">
                   <span className="font-bold text-xl mr-2">{dataDictResult.rawJson.total_columns}</span> Columns
                </div>
             </div>
             
             <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Column Name</th>
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Data Type</th>
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Missing</th>
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Outlier %</th>
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Unique</th>
                         <th className="py-3 px-4 font-semibold text-sm text-neutral-600">Sample / Stats</th>
                      </tr>
                   </thead>
                   <tbody>
                      {dataDictResult.rawJson.columns?.map((col: any, idx: number) => (
                         <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                            <td className="py-3 px-4 font-mono text-sm font-medium">{col.column_name}</td>
                            <td className="py-3 px-4">
                               <span className="text-xs px-2 py-1 bg-neutral-200 rounded-md text-neutral-700 font-medium">{col.data_type}</span>
                            </td>
                            <td className="py-3 px-4">
                               {col.missing_percentage > 0 ? (
                                   <span className="text-red-500 text-sm font-medium bg-red-50 px-2 py-1 rounded-md">{col.missing_percentage}% ({col.missing_count})</span>
                               ) : (
                                   <span className="text-neutral-400 text-sm px-2 py-1">0%</span>
                               )}
                            </td>
                            <td className="py-3 px-4">
                               {col.outlier_percentage > 0 ? (
                                   <span className="text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded-md">{col.outlier_percentage}%</span>
                               ) : (
                                   <span className="text-neutral-400 text-sm px-2 py-1">0%</span>
                               )}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">{col.unique_count}</td>
                            <td className="py-3 px-4 text-xs text-neutral-500 max-w-[200px] truncate">
                               {col.sample_values ? `[${col.sample_values.join(", ")}]` : ""}
                               {col.mean && <span className="ml-2 text-emerald-600 font-medium">Mean: {col.mean.toFixed(2)}</span>}
                               {col.top_value && <span className="ml-2 text-blue-600 font-medium">Mode: {col.top_value}</span>}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'layer1' && layer1Data && (
          <div className="p-12 pt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-16">
                   <Activity className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
                   <h3 className="text-3xl font-bold mb-4">Deep Machine Learning Analytics</h3>
                   <p className="text-lg text-neutral-600 mb-2 leading-relaxed max-w-2xl mx-auto">
                      <RichText content="Multi-method outlier detection and causal feature impact analysis powered by the Layer 1 Engine." />
                   </p>
                </div>
                
                {layer1Data.outlier_analysis && (
                   <div className="mb-16 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
                      <h4 className="text-2xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-red-500"/> Multi-Method Outlier Consensus</h4>
                      <p className="mb-4 text-neutral-600 font-medium">Found <span className="font-bold">{layer1Data.outlier_analysis.summary.total_outliers} outliers</span> ({layer1Data.outlier_analysis.summary.percentage_flagged.toFixed(2)}%) using consensus across Z-Score, MAD, Isolation Forest, and DBSCAN.</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {Object.entries(layer1Data.outlier_analysis.summary.method_flags).map(([method, pct]: any) => (
                              <div key={method} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center shadow-inner">
                                  <p className="text-xs font-bold text-neutral-400 uppercase">{method.replace('_', ' ')}</p>
                                  <p className="text-xl font-black text-neutral-800">{Number(pct).toFixed(1)}%</p>
                              </div>
                          ))}
                      </div>

                      {layer1Data.outlier_analysis.row_results && Object.keys(layer1Data.outlier_analysis.row_results).length > 0 && (
                          <div className="mt-8 space-y-3">
                              <h5 className="font-bold text-sm uppercase tracking-wider text-neutral-500 mb-4 border-b pb-2">Top Extreme Anomalies</h5>
                              {Object.entries(layer1Data.outlier_analysis.row_results).slice(0, 5).map(([rowIdx, result]: any) => {
                                  const methods = [];
                                  if (result.method_scores.z_score > 3.0) methods.push("Z-Score");
                                  if (result.method_scores.mad_score > 3.5) methods.push("MAD");
                                  if (result.method_scores.isolation_forest === 1) methods.push("Isolation Forest");
                                  if (result.method_scores.dbscan === 1) methods.push("DBSCAN");
                                  
                                  return (
                                      <div key={rowIdx} className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100 transition hover:shadow-md">
                                          <div className="font-bold text-red-900 bg-white px-3 py-1 rounded-lg border border-red-200 shadow-sm">Row #{rowIdx}</div>
                                          <div className="text-right">
                                              <p className="text-sm font-bold text-red-700">{methods.length}/4 methods flag this point as anomaly</p>
                                              <p className="text-[10px] uppercase font-bold text-red-400 mt-1 tracking-wider">({methods.join(', ')})</p>
                                          </div>
                                      </div>
                                  )
                              })}
                          </div>
                      )}
                   </div>
                )}
                
                {layer1Data.feature_importance && (
                   <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
                      <h4 className="text-2xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-amber-500"/> Causal Impact & Feature Ablation</h4>
                      
                      {layer1Data.feature_importance.insights && (
                          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                              {layer1Data.feature_importance.insights.map((insight: string, idx: number) => (
                                  <div key={idx} className="text-amber-800 font-medium flex gap-2 items-start">
                                      <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/> 
                                      <div><RichText content={insight} /></div>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      <div className="space-y-4">
                          {Object.entries(layer1Data.feature_importance.features).sort((a: any, b: any) => b[1].importance_score - a[1].importance_score).slice(0, 5).map(([feat, metrics]: any) => (
                              <div key={feat} className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                  <span className="font-bold text-neutral-800">{feat}</span>
                                  <div className="flex gap-6">
                                      <div className="text-right">
                                          <p className="text-[10px] uppercase font-bold text-neutral-400">Permutation Impact</p>
                                          <p className="text-sm font-black text-blue-600">{(metrics.importance_score * 100).toFixed(2)}%</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] uppercase font-bold text-neutral-400">Ablation Drop</p>
                                          <p className="text-sm font-black text-red-600">{(metrics.performance_impact * 100).toFixed(2)}%</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                   </div>
                )}
          </div>
        )}

        {activeTab === 'eda' && edaData && (
          <div className="p-12 pt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-16">
                   <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                   <h3 className="text-3xl font-bold mb-4">EDA Dashboard</h3>
                   <p className="text-lg text-neutral-600 mb-2 leading-relaxed w-full max-w-2xl mx-auto">
                      <RichText content="Exploratory Data Analysis (EDA) visualizes the distributions and relationships within your data. Use these charts to identify patterns, skewness, and category frequencies, ensuring your features are well-distributed for model training." />
                   </p>
                </div>

                <div className="flex justify-center gap-4 mb-10">
                    {['numerical', 'categorical', 'outlier', 'correlation'].map((view) => (
                        <button
                            key={view}
                            onClick={() => setEdaView(view as any)}
                            className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs transition-all ${edaView === view ? 'bg-blue-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                        >
                            {view} Plots
                        </button>
                    ))}
                </div>

                {edaView === 'numerical' && edaData.distributions && Object.keys(edaData.distributions).length > 0 && (
                   <div className="mb-16">
                      <h4 className="text-xl font-bold mb-8 text-neutral-800 border-b pb-4">Numeric Distributions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(edaData.distributions).map(([col, data]: [string, any]) => {
                            const chartData = data.labels.map((lbl: string, i: number) => ({
                                name: lbl,
                                count: data.counts[i]
                            }));
                            return (
                                <div key={col} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                   <h4 className="font-semibold text-center mb-4 text-neutral-700">{col}</h4>
                                   <div className="h-80">
                                       <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={chartData} margin={{ bottom: 35, left: 10, top: 10 }}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                              <XAxis dataKey="name" fontSize={11} tickMargin={10} axisLine={false} tickLine={false}>
                                                 <Label value="Value Range (Bins)" offset={-25} position="insideBottom" fontSize={12} fill="#171717" fontStyle="italic" />
                                              </XAxis>
                                              <YAxis fontSize={11} axisLine={false} tickLine={false}>
                                                 <Label value="Frequency" angle={-90} position="insideLeft" offset={-5} fontSize={12} fill="#171717" fontStyle="italic" />
                                              </YAxis>
                                              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                          </BarChart>
                                       </ResponsiveContainer>
                                   </div>
                                </div>
                            );
                        })}
                      </div>
                   </div>
                )}

                {edaView === 'categorical' && edaData.value_counts && Object.keys(edaData.value_counts).length > 0 && (
                   <div className="mt-16">
                      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b pb-4"><BarChart3 className="w-7 h-7 text-blue-400"/> Top Categories</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(edaData.value_counts).map(([col, data]: [string, any]) => {
                            const chartData = data.labels.map((lbl: string, i: number) => ({
                                name: lbl.length > 15 ? lbl.substring(0,15)+"..." : lbl,
                                count: data.counts[i],
                                fullName: lbl
                            }));
                            return (
                                <div key={col} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                   <h4 className="font-semibold text-center mb-4 text-neutral-700">{col}</h4>
                                   <div className="h-80">
                                       <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={chartData} layout="vertical" margin={{ left: 40, bottom: 35, top: 10 }}>
                                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                              <XAxis type="number" fontSize={11} axisLine={false} tickLine={false}>
                                                 <Label value="Count" offset={-25} position="insideBottom" fontSize={12} fill="#171717" fontStyle="italic" />
                                              </XAxis>
                                              <YAxis dataKey="name" type="category" fontSize={11} axisLine={false} tickLine={false}>
                                                 <Label value="Categories" angle={-90} position="insideLeft" offset={-35} fontSize={12} fill="#171717" fontStyle="italic" />
                                              </YAxis>
                                              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                              <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                                          </BarChart>
                                       </ResponsiveContainer>
                                   </div>
                                </div>
                            );
                        })}
                      </div>
                   </div>
                )}

                {edaView === 'outlier' && edaData.outlier_plots && Object.keys(edaData.outlier_plots).length > 0 && (
                   <div className="animate-in fade-in">
                      <h4 className="text-xl font-bold mb-8 text-neutral-800 border-b pb-4">Outlier Detection Plots</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(edaData.outlier_plots).map(([col, data]: [string, any]) => {
                            // Format data for simple 1D scatter with random jitter
                            const scatterData = data.outliers.map((val: number, i: number) => ({
                                id: i,
                                value: val,
                                jitter: Math.random() * 2 - 1
                            }));
                            
                            return (
                                <div key={col} className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 relative">
                                   <h4 className="font-semibold text-center mb-4 text-neutral-700">{col}</h4>
                                   <div className="flex justify-between text-[10px] text-neutral-500 font-mono mb-2 uppercase tracking-widest">
                                       <span>Min: {data.min.toFixed(2)}</span>
                                       <span>Median: {data.median.toFixed(2)}</span>
                                       <span>Max: {data.max.toFixed(2)}</span>
                                   </div>
                                   <div className="h-64 mt-4 border-l-2 border-neutral-200">
                                       <ResponsiveContainer width="100%" height="100%">
                                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <YAxis dataKey="value" name="Value" domain={['auto', 'auto']} tick={{fontSize: 10}} width={40} />
                                            <XAxis dataKey="jitter" type="number" hide domain={[-2, 2]} />
                                            <ZAxis range={[30, 30]} />
                                            <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} formatter={(val: any) => typeof val === 'number' ? val.toFixed(2) : val} labelFormatter={() => 'Outlier'} />
                                            <Scatter name="Outliers" data={scatterData} fill="#ef4444">
                                                {scatterData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill="#ef4444" opacity={0.6} />
                                                ))}
                                            </Scatter>
                                            {/* Add a central reference line for median */}
                                          </ScatterChart>
                                       </ResponsiveContainer>
                                   </div>
                                   <div className="absolute top-4 right-4 text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                                       {data.outliers.length} anomalies
                                   </div>
                                </div>
                            );
                        })}
                      </div>
                   </div>
                )}

                {edaView === 'correlation' && edaData.correlation_matrix && (
                   <div className="animate-in fade-in overflow-x-auto">
                      <h4 className="text-xl font-bold mb-8 text-neutral-800 border-b pb-4">Correlation Heatmap</h4>
                      <p className="text-sm text-neutral-500 mb-6 italic">Dark red indicates strong positive correlation, dark blue indicates strong negative correlation.</p>
                      <div className="inline-block border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="text-xs text-center border-collapse">
                              <thead>
                                  <tr>
                                      <th className="p-3 bg-neutral-100 border-r border-b border-neutral-200 text-neutral-500 font-bold max-w-[120px] truncate"></th>
                                      {edaData.correlation_matrix.columns.map((col: string) => (
                                          <th key={col} className="p-3 bg-neutral-100 border-b border-r border-neutral-200 text-neutral-700 font-bold max-w-[100px] truncate" title={col}>
                                              {col.length > 10 ? col.substring(0,8)+'..' : col}
                                          </th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody>
                                  {edaData.correlation_matrix.columns.map((rowCol: string, i: number) => (
                                      <tr key={rowCol}>
                                          <th className="p-3 bg-neutral-100 border-r border-b border-neutral-200 text-neutral-700 font-bold text-left max-w-[120px] truncate" title={rowCol}>
                                              {rowCol.length > 12 ? rowCol.substring(0,10)+'..' : rowCol}
                                          </th>
                                          {edaData.correlation_matrix.matrix[i].map((val: number, j: number) => {
                                              // Compute color (Red for positive, Blue for negative)
                                              let bgColor = '#ffffff';
                                              let textColor = '#000000';
                                              if (val > 0) {
                                                  const intensity = Math.min(Math.floor(val * 255), 255);
                                                  bgColor = `rgb(255, ${255 - intensity}, ${255 - intensity})`;
                                                  if (val > 0.6) textColor = '#ffffff';
                                              } else if (val < 0) {
                                                  const intensity = Math.min(Math.floor(Math.abs(val) * 255), 255);
                                                  bgColor = `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
                                                  if (val < -0.6) textColor = '#ffffff';
                                              }
                                              
                                              return (
                                                  <td 
                                                      key={j} 
                                                      className="p-3 border-r border-b border-neutral-200 font-mono transition-transform hover:scale-110 cursor-default"
                                                      style={{ backgroundColor: bgColor, color: textColor }}
                                                      title={`${rowCol} vs ${edaData.correlation_matrix.columns[j]}: ${val.toFixed(3)}`}
                                                  >
                                                      {val.toFixed(2)}
                                                  </td>
                                              );
                                          })}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                   </div>
                )}
             </div>
        )}

        {activeTab === 'remediation' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-12 pt-0 relative overflow-hidden transition">
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 text-neutral-900 w-full">
                    <div className="text-center mb-10">
                        <Sparkles className="w-16 h-16 text-green-600 mx-auto mb-6" />
                        <h3 className="text-3xl font-bold mb-4">Pipeline Builder</h3>
                        <p className="text-neutral-600 text-lg max-w-2xl mx-auto mb-8 w-full leading-relaxed">
                            <RichText content="Configure a robust data pipeline to automatically clean and transform your dataset. Select your desired steps below, and the DataScope Engine will execute them sequentially." />
                        </p>
                    </div>
                    
                    <div className="text-left bg-neutral-50 p-8 rounded-xl mb-10 space-y-4 border border-neutral-100 shadow-inner max-w-3xl mx-auto">
                        
                        {/* Drop Missing Step */}
                        <div 
                            className={`flex gap-5 items-center p-4 rounded-xl border-2 transition cursor-pointer ${pipelineConfig.some(s => s.id === "0") ? 'bg-white border-green-500 shadow-sm' : 'bg-neutral-100 border-transparent opacity-60'}`}
                            onClick={() => toggleStep("0")}
                        >
                            <div className="p-2">
                                {pipelineConfig.some(s => s.id === "0") ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-neutral-300 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-neutral-900 text-lg">Step 1: Drop Heavy Missing Columns</h4>
                                <p className="text-sm text-neutral-500">Automatically drops any column that is missing more than <span className="font-mono text-xs bg-black/5 px-1 rounded font-bold text-green-700">50%</span> of its values.</p>
                            </div>
                        </div>

                        {/* Imputation Step */}
                        <div 
                            className={`flex gap-5 items-center p-4 rounded-xl border-2 transition cursor-pointer ${pipelineConfig.some(s => s.id === "1") ? 'bg-white border-green-500 shadow-sm' : 'bg-neutral-100 border-transparent opacity-60'}`}
                            onClick={() => toggleStep("1")}
                        >
                            <div className="p-2">
                                {pipelineConfig.some(s => s.id === "1") ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-neutral-300 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-neutral-900 text-lg">Step 2: Impute Missing Values</h4>
                                <p className="text-sm text-neutral-500">Numeric NaNs replaced with <span className="font-mono text-xs bg-black/5 px-1 rounded font-bold text-green-700">Median</span>. Text NaNs replaced with <span className="font-mono text-xs bg-black/5 px-1 rounded font-bold text-green-700">Mode</span>.</p>
                            </div>
                        </div>

                        {/* Outlier Step */}
                        <div 
                            className={`flex gap-5 items-center p-4 rounded-xl border-2 transition cursor-pointer ${pipelineConfig.some(s => s.id === "2") ? 'bg-white border-green-500 shadow-sm' : 'bg-neutral-100 border-transparent opacity-60'}`}
                            onClick={() => toggleStep("2")}
                        >
                            <div className="p-2">
                                {pipelineConfig.some(s => s.id === "2") ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-neutral-300 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-neutral-900 text-lg">Step 3: Multi-Method Outlier Destruction</h4>
                                <p className="text-sm text-neutral-500">Ensemble of Isolation Forest, MAD, DBSCAN, and Z-Score drops rows with consensus &ge; 60%.</p>
                            </div>
                        </div>

                        {/* Encoding Step */}
                        <div 
                            className={`flex gap-5 items-center p-4 rounded-xl border-2 transition cursor-pointer ${pipelineConfig.some(s => s.id === "3") ? 'bg-white border-green-500 shadow-sm' : 'bg-neutral-100 border-transparent opacity-60'}`}
                            onClick={() => toggleStep("3")}
                        >
                            <div className="p-2">
                                {pipelineConfig.some(s => s.id === "3") ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-neutral-300 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-neutral-900 text-lg">Step 4: Encode Categorical Features</h4>
                                <p className="text-sm text-neutral-500">Applies robust One-Hot Encoding to categorical variables automatically.</p>
                            </div>
                        </div>

                        {/* Scaling Step */}
                        <div 
                            className={`flex gap-5 items-center p-4 rounded-xl border-2 transition cursor-pointer ${pipelineConfig.some(s => s.id === "4") ? 'bg-white border-green-500 shadow-sm' : 'bg-neutral-100 border-transparent opacity-60'}`}
                            onClick={() => toggleStep("4")}
                        >
                            <div className="p-2">
                                {pipelineConfig.some(s => s.id === "4") ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-neutral-300 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-neutral-900 text-lg">Step 5: Standardize Numeric Features</h4>
                                <p className="text-sm text-neutral-500">Scales numeric features so they have a mean of 0 and a standard deviation of 1 (StandardScaler).</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={cleaning}
                            className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-12 py-4 rounded-full font-bold text-xl shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-6 h-6" />
                            {cleaning ? "Cleaning Dataset..." : "Select File & Clean"}
                        </button>
                        <p className="text-xs text-neutral-500 mt-4 font-medium uppercase tracking-widest">Secure local processing • No data storage</p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="pt-0 pb-12 mb-12">
                <div className="text-center mb-16">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold mb-4">Detected Dataset Issues</h3>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                        <RichText content="We found critical issues that may impact your model's predictive performance. Applying the suggested fixes will demonstrably improve your baseline model stability." />
                    </p>
                </div>

                {shapData && shapData.clusters && Object.keys(shapData.clusters).length > 0 ? (
                    <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-[2.5rem] p-10 shadow-lg transition hover:shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-col items-center text-center mb-8">
                                <Activity className="w-12 h-12 text-emerald-600 mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Segmented Model Intelligence</h3>
                                <p className="text-neutral-500 text-sm max-w-3xl leading-relaxed">
                                    <RichText content="Your data naturally grouped into distinct behavioral clusters. Here are the top features driving predictions within each specific segment." />
                                </p>
                            </div>

                            {shapData.insights && shapData.insights.length > 0 && (
                                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                    {shapData.insights.map((insight: string, idx: number) => (
                                        <p key={idx} className="text-emerald-800 font-medium text-sm flex gap-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0"/> {insight}
                                        </p>
                                    ))}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.entries(shapData.clusters).map(([clusterName, clusterInfo]: any) => (
                                    <div key={clusterName} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 shadow-inner">
                                        <h4 className="font-black text-lg text-neutral-800 mb-4 pb-2 border-b uppercase tracking-tight">{clusterName}</h4>
                                        <div className="space-y-4">
                                            {clusterInfo.top_features.map((feature: string) => {
                                                const importance = clusterInfo.feature_importance[feature];
                                                const maxVal = Math.max(...(Object.values(clusterInfo.feature_importance) as number[]));
                                                const width = Math.max(5, (importance / maxVal) * 100);
                                                
                                                return (
                                                    <div key={feature} className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-center text-xs font-bold text-neutral-600 uppercase tracking-wide">
                                                            <span className="truncate pr-4">{feature}</span>
                                                            <span className="text-emerald-600">{(importance * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${width}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    shapData && shapData.features && (
                        <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-[2.5rem] p-10 shadow-lg transition hover:shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex flex-col items-center text-center mb-8">
                                    <Activity className="w-12 h-12 text-emerald-600 mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Model Intelligence</h3>
                                    <p className="text-neutral-500 text-sm max-w-3xl leading-relaxed">
                                        <RichText content={`Based on a SHAP analysis of a Random Forest trained to predict ${shapData.target}, these are the Top 10 most influential features driving your data's predictive power.`} />
                                    </p>
                                </div>
                                
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {shapData.features.slice(0, 10).map((feature: string, idx: number) => {
                                        const maxVal = Math.max(...shapData.importance);
                                        const width = Math.max(5, (shapData.importance[idx] / maxVal) * 100);
                                        
                                        return (
                                            <div key={feature} className="flex items-center gap-6">
                                                <span className="w-48 text-sm font-bold truncate text-neutral-700 text-right tracking-tight">{feature}</span>
                                                <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`} 
                                                        style={{ width: `${width}%` }}
                                                    ></div>
                                                </div>
                                                <span className="w-16 text-sm font-bold text-neutral-500">{(shapData.importance[idx] * 100).toFixed(1)}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Individual Issue Cards */}
            <div className="space-y-6">
                {actualIssues
                  .sort((a, b) => {
                      const order: Record<string, number> = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
                      return order[a.severity] - order[b.severity];
                  })
                  .map((issue) => (
                    <div key={issue.id} className={`p-8 rounded-xl border ${severityBg[issue.severity]} backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:translate-x-1 hover:shadow-lg`}>
              
              {/* Left side: Icon & Details */}
              <div className="flex gap-5 items-start">
                  <div className="pt-1">
                      {severityIcon[issue.severity]}
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-700' : issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-blue-500/20 text-blue-700'}`}>
                              {issue.severity} PRIORITY
                          </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-1 text-neutral-900"><RichText content={issue.description} /></h3>
                      <p className="text-sm text-neutral-600">→ Fix: <span className=" font-medium text-neutral-800"><RichText content={issue.suggestion} /></span></p>
                  </div>
              </div>

              {/* Right side: Impact Metric */}
              <div className="flex flex-col gap-3 bg-white/60 border border-black/5 p-4 rounded-xl shadow-sm min-w-[280px]">
                  <div className={`text-center ${issue.rawJson?.metric ? 'pb-3 border-b border-black/5' : ''}`}>
                      <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-600">
                          <Activity className="w-4 h-4" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">Projected Impact</span>
                      </div>
                      <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                          {issue.impactScore}
                      </div>
                      {issue.rawJson?.confidence_score !== undefined && (
                          <div className="text-[9px] text-neutral-500 mt-1 uppercase tracking-widest font-bold">
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

                {actualIssues.length === 0 && (
                   <div className="text-center py-20 border border-neutral-100 rounded-3xl bg-white shadow-xl">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold">Your dataset looks great!</h3>
                      <p className="text-neutral-400 mt-2">No critical machine learning or structural issues found.</p>
                   </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'drift' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-12 pt-0">
                <div className="relative z-10 w-full mx-auto">
                    <div className="text-center mb-10">
                        <GitBranch className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h3 className="text-3xl font-bold mb-4 text-neutral-900">Data Drift Detection</h3>
                        <p className="text-lg text-neutral-600 w-full max-w-2xl mx-auto leading-relaxed">
                            <RichText content="Upload your Test or Production dataset to compare against this Training dataset. We use the Population Stability Index (PSI) to instantly detect if your feature distributions have drifted and are threatening model performance." />
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <input type="file" ref={driftRefInput} className="hidden" onChange={(e) => setDriftRefFile(e.target.files?.[0] || null)} accept=".csv,.xlsx,.xls,.json,.parquet" />
                            <button onClick={() => driftRefInput.current?.click()} className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl transition-all hover:-translate-y-1">
                                <Sparkles className="w-5 h-5" />
                                {driftRefFile ? driftRefFile.name : "1. Upload Training Data"}
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <input type="file" ref={driftTestInput} className="hidden" onChange={(e) => setDriftTestFile(e.target.files?.[0] || null)} accept=".csv,.xlsx,.xls,.json,.parquet" />
                            <button onClick={() => driftTestInput.current?.click()} className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl transition-all hover:-translate-y-1">
                                <Sparkles className="w-5 h-5" />
                                {driftTestFile ? driftTestFile.name : "2. Upload Prod Data"}
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleRunDrift}
                            disabled={driftLoading || !driftRefFile || !driftTestFile}
                            className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-10 py-4 rounded-xl font-bold shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <GitBranch className="w-5 h-5" />
                            {driftLoading ? "Analyzing..." : "Run Multi-Metric Drift"}
                        </button>
                    </div>

                    {driftResults && driftResults.features && (
                        <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
                            <h4 className="text-2xl font-bold mb-6 text-center">
                                {driftResults.overall_drift_detected ? (
                                    <span className="text-red-600 flex items-center justify-center gap-2"><AlertTriangle className="w-6 h-6" /> Significant Drift Detected</span>
                                ) : (
                                    <span className="text-emerald-600 flex items-center justify-center gap-2"><CheckCircle className="w-6 h-6" /> No Significant Drift</span>
                                )}
                            </h4>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-6 text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-4 pb-2 border-b border-neutral-200 text-center">
                                    <div className="col-span-2 text-left">Feature</div>
                                    <div>PSI</div>
                                    <div>KL Divergence</div>
                                    <div>Wasserstein</div>
                                    <div>KS Stat</div>
                                </div>
                                {Object.entries(driftResults.features).map(([featureName, data]: any) => (
                                    <div key={featureName} className="grid grid-cols-6 items-center bg-white p-4 rounded-xl border border-neutral-200 shadow-sm text-center">
                                        <div className="col-span-2 font-bold text-neutral-800 text-left flex items-center gap-2">
                                            {featureName}
                                            {data.drift_detected && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Drift Detected"></span>}
                                        </div>
                                        <div className={`font-mono text-sm font-bold ${data.drift_detected ? 'text-red-600' : 'text-neutral-500'}`}>{data.psi.toFixed(3)}</div>
                                        <div className={`font-mono text-sm font-bold ${data.drift_detected ? 'text-red-600' : 'text-neutral-500'}`}>{data.kl_divergence.toFixed(3)}</div>
                                        <div className={`font-mono text-sm font-bold ${data.drift_detected ? 'text-red-600' : 'text-neutral-500'}`}>{data.wasserstein.toFixed(3)}</div>
                                        <div className={`font-mono text-sm font-bold ${data.drift_detected ? 'text-red-600' : 'text-neutral-500'}`}>{data.ks_statistic.toFixed(3)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
