import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { filesAPI, categoriesAPI } from '../../services/api';

const EditFileModal = ({ isOpen, onClose, onSuccess, file }) => {
    const [fileName, setFileName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [tags, setTags] = useState('');
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (file) {
                setFileName(file.file_name || '');
                setCategoryId(file.category_id?._id || file.category_id || '');
                setTags(file.tags ? file.tags.join(', ') : '');
            }
        }
    }, [isOpen, file]);

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Category name is required');
            return;
        }

        try {
            const response = await categoriesAPI.create({ category_name: newCategoryName });
            setCategories([...categories, response.data.data]);
            setCategoryId(response.data.data._id);
            setNewCategoryName('');
            setShowNewCategory(false);
            setError('');
        } catch (error) {
            setError('Error creating category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fileName.trim()) {
            setError('File name is required');
            return;
        }

        try {
            setLoading(true);
            const updateData = {
                file_name: fileName,
                category_id: categoryId || null,
                tags: tags
            };

            const response = await filesAPI.update(file._id, updateData);

            if (response.data.success) {
                setError('');
                onSuccess();
                onClose();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error updating file');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">Edit File</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-sm">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">File Name *</label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter file name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <div className="flex gap-2">
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowNewCategory(!showNewCategory)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                            >
                                New
                            </button>
                        </div>

                        {showNewCategory && (
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="New category name"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
                                >
                                    Create
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. important, urgent, meeting"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 text-sm disabled:bg-blue-400"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFileModal;
