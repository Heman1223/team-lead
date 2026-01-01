import React, { useState } from 'react';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Check,
    ArrowRight
} from 'lucide-react';
import { leadsAPI } from '../../services/api';
import LeadImportMapping from './LeadImportMapping';

const LeadImport = ({ onComplete }) => {
    const [step, setStep] = useState('upload'); // upload, mapping, preview, result
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [rawPreviewData, setRawPreviewData] = useState(null);
    const [mappedData, setMappedData] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [mappingConfig, setMappingConfig] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const ext = selectedFile.name.split('.').pop().toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(ext)) {
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Please select a valid CSV or Excel file');
                setFile(null);
            }
        }
    };

    const handleUploadAndAnalyze = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // This now returns raw data for mapping
            const response = await leadsAPI.previewLeads(formData);
            setRawPreviewData(response.data.data);
            setStep('mapping');
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleMappingConfirm = (mapping) => {
        setMappingConfig(mapping);
        processMappedData(mapping);
    };

    const processMappedData = (mapping) => {
        if (!rawPreviewData?.allData) return;

        const allData = rawPreviewData.allData;
        const validCategories = ['web_development', 'mobile_app', 'ui_ux_design', 'digital_marketing', 'seo', 'content_writing', 'consulting', 'other'];

        try {
            const processedLeads = allData.map(row => {
                // Apply mapping
                const clientName = row[mapping.clientName];
                const email = row[mapping.email];
                const phone = row[mapping.phone];
                const categoryRaw = row[mapping.category];
                const source = row[mapping.source] || 'csv_import';
                const description = row[mapping.description] || '';
                const estimatedValue = parseFloat(row[mapping.estimatedValue] || 0) || 0;

                const category = categoryRaw?.trim() || 'other';

                // Basic Validation
                const isValid = !!clientName;
                let errorMsg = null;

                if (!isValid) errorMsg = 'Missing Client Name';

                return {
                    clientName,
                    email: email?.toString().toLowerCase().trim() || '',
                    phone: phone?.toString().trim() || '',
                    category,
                    source,
                    description,
                    estimatedValue,
                    isValid,
                    error: errorMsg
                };
            });

            // Filter out totally empty rows
            const nonEmptyLeads = processedLeads.filter(l => l.clientName || l.email);

            const summary = {
                total: nonEmptyLeads.length,
                valid: nonEmptyLeads.filter(l => l.isValid).length,
                invalid: nonEmptyLeads.filter(l => !l.isValid).length
            };

            setMappedData({
                leads: nonEmptyLeads,
                summary
            });
            setStep('preview');

        } catch (err) {
            console.error(err);
            setError('Failed to process data with selected mapping');
        }
    };

    const handleConfirmImport = async () => {
        if (!mappedData) return;
        setUploading(true);

        try {
            const validLeads = mappedData.leads.filter(l => l.isValid);
            // We just send the valid leads object directly now
            const response = await leadsAPI.importLeads(validLeads);
            setResult({
                importedCount: response.data.count,
                errorCount: mappedData.summary.total - response.data.count // Approximate
            });
            setStep('result');
            if (onComplete) onComplete();
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "Client Name,Email Address,Phone Number,Category,Description,Source,Value\nJohn Doe,john@example.com,+123456789,web_development,New website project,referral,5000";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_leads.csv';
        a.click();
    };

    const resetImport = () => {
        setFile(null);
        setRawPreviewData(null);
        setMappedData(null);
        setResult(null);
        setError(null);
        setStep('upload');
    };

    // Result Screen
    if (step === 'result' && result) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white border-2 border-green-100 rounded-xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-green-600 w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful</h2>
                    <p className="text-gray-600 mb-8">Your leads have been successfully processed.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-3xl font-bold text-green-700">{result.importedCount}</p>
                            <p className="text-sm text-green-800 font-medium mt-1">Imported</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="text-3xl font-bold text-red-700">{result.errorCount}</p>
                            <p className="text-sm text-red-800 font-medium mt-1">Skipped</p>
                        </div>
                    </div>

                    <button
                        onClick={resetImport}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
                    >
                        Import More Leads
                    </button>
                </div>
            </div>
        );
    }

    // Mapping Screen
    if (step === 'mapping' && rawPreviewData) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <LeadImportMapping
                        fileHeader={rawPreviewData.headers}
                        sampleData={rawPreviewData.sampleData}
                        onConfirm={handleMappingConfirm}
                        onCancel={resetImport}
                    />
                </div>
            </div>
        );
    }

    // Preview Screen
    if (step === 'preview' && mappedData) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Preview Import</h2>
                        <p className="text-gray-500 text-sm mt-1">Review the data before finalizing.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('mapping')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleConfirmImport}
                            disabled={uploading || mappedData.summary.valid === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        >
                            {uploading ? 'Importing...' : `Import ${mappedData.summary.valid} Leads`}
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-gray-600 font-semibold w-12">Status</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Client Name</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Email</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Phone</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Category</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Source</th>
                                    <th className="px-6 py-3 text-gray-600 font-semibold">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mappedData.leads.map((l, idx) => (
                                    <tr key={idx} className={l.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}>
                                        <td className="px-6 py-3">
                                            {l.isValid ? (
                                                <CheckCircle2 size={18} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={18} className="text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-gray-900 font-medium">{l.clientName || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600">{l.email || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600">{l.phone || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600 capitalize">{l.category}</td>
                                        <td className="px-6 py-3 text-gray-600">{l.source}</td>
                                        <td className="px-6 py-3">
                                            {l.error && <span className="text-red-600 text-xs font-semibold">{l.error}</span>}
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

    // Upload Screen (Default)
    return (
        <div className="max-w-2xl mx-auto space-y-8 mt-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Import Leads</h2>
                <p className="text-gray-500">Upload a CSV or Excel file to import leads.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer mb-6
                        ${file
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                    `}
                >
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileChange}
                        accept=".csv, .xlsx, .xls"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${file ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {file ? <Check size={24} /> : <Upload size={24} />}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{file ? file.name : 'Click to upload'}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'CSV or Excel (XLSX, XLS)'}
                            </p>
                        </div>
                    </label>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={downloadSample}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Download Template
                    </button>
                    <button
                        onClick={handleUploadAndAnalyze}
                        disabled={!file || uploading}
                        className={`
                            flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2
                            ${!file || uploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
                        `}
                    >
                        {uploading ? 'Analyzing...' : 'Next'}
                        {!uploading && <ArrowRight size={18} />}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadImport;
