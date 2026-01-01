import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

const SYSTEM_FIELDS = [
    { key: 'clientName', label: 'Client Name', required: true },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'phone', label: 'Phone Number', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'estimatedValue', label: 'Estimated Value', required: false },
    { key: 'description', label: 'Description', required: false }
];

const LeadImportMapping = ({ fileHeader, sampleData, onConfirm, onCancel }) => {
    const [mapping, setMapping] = useState({});

    // Auto-guess mapping based on header names
    useEffect(() => {
        const newMapping = {};

        fileHeader.forEach(header => {
            const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (['clientname', 'name', 'fullname', 'customer', 'contact'].some(k => h.includes(k))) {
                if (!newMapping.clientName) newMapping.clientName = header;
            }
            if (['email', 'mail'].some(k => h.includes(k))) {
                if (!newMapping.email) newMapping.email = header;
            }
            if (['phone', 'mobile', 'cell', 'tel'].some(k => h.includes(k))) {
                if (!newMapping.phone) newMapping.phone = header;
            }
            if (['category', 'type', 'projecttype'].some(k => h.includes(k))) {
                if (!newMapping.category) newMapping.category = header;
            }
            if (['source', 'origin', 'referral'].some(k => h.includes(k))) {
                if (!newMapping.source) newMapping.source = header;
            }
            if (['value', 'budget', 'revenue', 'amount'].some(k => h.includes(k))) {
                if (!newMapping.estimatedValue) newMapping.estimatedValue = header;
            }
            if (['description', 'notes', 'details', 'message'].some(k => h.includes(k))) {
                if (!newMapping.description) newMapping.description = header;
            }
        });

        setMapping(newMapping);
    }, [fileHeader]);

    const handleMappingChange = (systemField, fileColumn) => {
        setMapping(prev => ({
            ...prev,
            [systemField]: fileColumn
        }));
    };

    const isMappingValid = () => {
        return SYSTEM_FIELDS
            .filter(f => f.required)
            .every(f => mapping[f.key]);
    };

    const handleConfirm = () => {
        if (isMappingValid()) {
            onConfirm(mapping);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Map Columns</h2>
                <p className="text-gray-600">Match your file columns to the system fields.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {SYSTEM_FIELDS.map((field) => (
                    <div key={field.key} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">{field.label}</h3>
                                    {field.required && (
                                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">Required</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">
                                    Map to a column from your file
                                </p>
                            </div>

                            <div className="flex-1">
                                <select
                                    value={mapping[field.key] || ''}
                                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a column...</option>
                                    {fileHeader.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sample Preview */}
                        {mapping[field.key] && sampleData.length > 0 && (
                            <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                                <span className="text-gray-500 text-xs font-semibold block mb-1">Preview value:</span>
                                <div className="text-gray-900 truncate">
                                    {sampleData[0][mapping[field.key]] || <span className="text-gray-400 italic">Empty</span>}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                    onClick={onCancel}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!isMappingValid()}
                    className={`
                        px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
                        ${isMappingValid()
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    <Check size={18} />
                    Continue to Preview
                </button>
            </div>

            {!isMappingValid() && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle size={16} />
                    <span>Please map all required fields to continue</span>
                </div>
            )}
        </div>
    );
};

export default LeadImportMapping;
