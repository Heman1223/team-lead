import React, { useState } from 'react';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Download,
    Check,
    AlertTriangle
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
            setResult({ 
                importedCount: response.data.count, 
                errorCount: previewData.summary.invalid 
            });
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

    const resetImport = () => {
        setFile(null);
        setPreviewData(null);
        setResult(null);
        setError(null);
    };

    // Success Screen
    if (result) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white border-2 border-green-200 rounded-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-green-600 w-8 h-8" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
                        <p className="text-gray-600">Your leads have been imported successfully.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                            <p className="text-3xl font-bold text-green-600">{result.importedCount}</p>
                            <p className="text-sm text-gray-600 mt-1">Imported</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <p className="text-3xl font-bold text-red-600">{result.errorCount}</p>
                            <p className="text-sm text-gray-600 mt-1">Skipped</p>
                        </div>
                    </div>

                    <button
                        onClick={resetImport}
                        className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold"
                    >
                        Import More Leads
                    </button>
                </div>
            </div>
        );
    }

    // Preview Screen
    if (previewData) {
        return (
            <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Import Preview</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-2xl font-bold text-blue-600">{previewData.summary.total}</p>
                            <p className="text-sm text-gray-600 mt-1">Total</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-2xl font-bold text-green-600">{previewData.summary.valid}</p>
                            <p className="text-sm text-gray-600 mt-1">Valid</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-2xl font-bold text-red-600">{previewData.summary.invalid}</p>
                            <p className="text-sm text-gray-600 mt-1">Invalid</p>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {previewData.leads.slice(0, 10).map((lead, index) => (
                                        <tr key={index} className={lead.isValid ? 'bg-white' : 'bg-red-50'}>
                                            <td className="px-4 py-3">
                                                {lead.isValid ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-600" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{lead.clientName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{lead.email}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{lead.phone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                                {lead.category?.replace('_', ' ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {previewData.leads.length > 10 && (
                        <p className="text-sm text-gray-600 mt-3 text-center">
                            Showing first 10 of {previewData.leads.length} leads
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={resetImport}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmImport}
                        disabled={uploading || previewData.summary.valid === 0}
                        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Importing...' : `Import ${previewData.summary.valid} Leads`}
                    </button>
                </div>
            </div>
        );
    }

    // Upload Screen
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Import Instructions</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">1.</span>
                        <span>Download the sample CSV file to see the required format</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">2.</span>
                        <span>Prepare your CSV file with columns: client_name, email, phone, project_category, description, source</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">3.</span>
                        <span>Upload your CSV file and preview the data</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-semibold">4.</span>
                        <span>Confirm to import valid leads (duplicates will be skipped)</span>
                    </li>
                </ol>
                
                <button
                    onClick={downloadSample}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm"
                >
                    <Download className="w-4 h-4" />
                    Download Sample CSV
                </button>
            </div>

            {/* Upload Area */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-orange-400 transition-colors">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Upload CSV File</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Click to browse or drag and drop your CSV file here
                    </p>
                    {file && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                            <FileText className="w-4 h-4" />
                            <span>{file.name}</span>
                        </div>
                    )}
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-900">Error</h4>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Preview Button */}
            {file && (
                <button
                    onClick={handlePreview}
                    disabled={uploading}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? 'Processing...' : 'Preview Import'}
                </button>
            )}
        </div>
    );
};

export default LeadImport;
