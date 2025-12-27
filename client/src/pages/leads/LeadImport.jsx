import React, { useState } from 'react';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Download,
    Check,
    AlertTriangle,
    ArrowRight,
    Users
} from 'lucide-react';
import { leadsAPI } from '../../services/api';

const LeadImport = ({ onComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Please select a valid CSV file');
            setFile(null);
        }
    };

    const handlePreview = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await leadsAPI.previewLeads(formData);
            setPreviewData(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Preview failed');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;
        setUploading(true);

        try {
            const validLeads = previewData.leads.filter(l => l.isValid);
            const response = await leadsAPI.importLeads(validLeads);
            setResult({ importedCount: response.data.count, errorCount: previewData.summary.invalid });
            if (onComplete) onComplete();
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "client_name,email,phone,project_category,description,source\nJohn Doe,john@example.com,+123456789,web_development,New website project,referral";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_leads.csv';
        a.click();
    };

    if (result) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-white tracking-tight">Data Synchronized</h2>
                        <p className="text-gray-400">Your lead pipeline has been successfully updated with new records.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <div className="bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 group hover:scale-105 transition-transform duration-300">
                            <p className="text-5xl font-black text-emerald-400 tracking-tighter">{result.importedCount}</p>
                            <p className="text-xs text-emerald-500 font-black uppercase tracking-widest mt-2">Active Leads</p>
                        </div>
                        <div className="bg-rose-500/10 p-8 rounded-[2rem] border border-rose-500/20 group hover:scale-105 transition-transform duration-300">
                            <p className="text-5xl font-black text-rose-400 tracking-tighter">{result.errorCount}</p>
                            <p className="text-xs text-rose-500 font-black uppercase tracking-widest mt-2">Filtered</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setResult(null); setPreviewData(null); setFile(null); }}
                        className="px-10 py-4 bg-gray-800 text-white rounded-2xl font-black hover:bg-gray-700 transition-all border border-gray-700 shadow-xl"
                    >
                        Process Another Batch
                    </button>
                </div>
            </div>
        );
    }

    if (previewData) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-white">Import Preview</h2>
                        <p className="text-gray-400 text-sm">Review the data before confirming the import</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setPreviewData(null)} className="px-6 py-2.5 bg-gray-800 text-gray-400 rounded-xl font-bold">Cancel</button>
                        <button
                            onClick={handleConfirmImport}
                            disabled={uploading || previewData.summary.valid === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-xl shadow-orange-500/20 disabled:opacity-50"
                        >
                            {uploading ? 'Importing...' : `Confirm Import (${previewData.summary.valid} Leads)`}
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700/50">
                                    <th className="px-6 py-4 text-gray-400 font-bold">Status</th>
                                    <th className="px-6 py-4 text-gray-400 font-bold">Client Name</th>
                                    <th className="px-6 py-4 text-gray-400 font-bold">Email</th>
                                    <th className="px-6 py-4 text-gray-400 font-bold">Phone</th>
                                    <th className="px-6 py-4 text-gray-400 font-bold">Category</th>
                                    <th className="px-6 py-4 text-gray-400 font-bold">Reason/Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                {previewData.leads.map((l, idx) => (
                                    <tr key={idx} className={l.isValid ? 'bg-transparent' : 'bg-rose-500/5'}>
                                        <td className="px-6 py-4">
                                            {l.isValid ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : (
                                                <AlertCircle size={18} className="text-rose-500" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-200">{l.clientName}</td>
                                        <td className="px-6 py-4 text-gray-400">{l.email}</td>
                                        <td className="px-6 py-4 text-gray-400">{l.phone}</td>
                                        <td className="px-6 py-4 text-gray-400 capitalize">{l.category}</td>
                                        <td className="px-6 py-4">
                                            {l.error && <span className="text-rose-400 text-xs font-medium">{l.error}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900/50 border border-gray-700/50 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-center space-y-6 mb-12">
                    <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                        <Upload className="text-orange-500 w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black text-white tracking-tighter">Bulk Lead <span className="text-orange-500">Intake</span></h2>
                        <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium">
                            Scale your pipeline by importing large datasets. Our system validates every record
                            in real-time to ensure data integrity.
                        </p>
                    </div>
                </div>

                <div
                    className={`
                        group relative border-2 border-dashed rounded-[2.5rem] p-24 text-center transition-all duration-500 mb-12 cursor-pointer
                        ${file
                            ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.1)]'
                            : 'border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5'}
                    `}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        onChange={handleFileChange}
                        accept=".csv"
                    />
                    <div className="space-y-6 relative z-10">
                        <div className={`p-6 bg-gray-900/80 rounded-3xl inline-block group-hover:scale-110 transition-transform duration-500 border border-white/5 ${file ? 'text-orange-500' : 'text-gray-600'}`}>
                            <FileText className="w-16 h-16" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{file ? file.name : 'Drop CSV file here or click'}</p>
                            <p className="text-gray-500 font-bold mt-2">{file ? `${(file.size / 1024).toFixed(2)} KB detected` : 'Maximum file size: 10MB'}</p>
                        </div>
                        {file && (
                            <div className="flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-xs">
                                <Check size={16} />
                                File Ready for Analysis
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <button
                        onClick={handlePreview}
                        disabled={!file || uploading}
                        className={`
                            flex-1 py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4
                            ${!file || uploading
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95'
                            }
                        `}
                    >
                        {uploading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <span>Initialize Preview</span>
                                <ArrowRight size={28} />
                            </>
                        )}
                    </button>
                    <button
                        onClick={downloadSample}
                        className="px-12 py-6 bg-gray-900 text-gray-400 rounded-[2rem] font-bold hover:text-white transition-all border border-gray-800 flex items-center justify-center gap-3 hover:bg-gray-800 shadow-xl"
                    >
                        <Download size={24} />
                        Get Template
                    </button>
                </div>

                {error && (
                    <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-400 font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <AlertCircle size={24} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadImport;
