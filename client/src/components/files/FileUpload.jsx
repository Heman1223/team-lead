import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { filesAPI, categoriesAPI, usersAPI } from '../../services/api';

/**
 * FileUpload Component
 * Modal for uploading files with category, tags, and access control
 */
const FileUpload = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [tags, setTags] = useState('');
    const [accessMembers, setAccessMembers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchUsers();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const maxSize = 50 * 1024 * 1024; // 50MB

            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Invalid file type. Allowed: PDF, PNG, JPG, JPEG, DOCX');
                return;
            }

            if (selectedFile.size > maxSize) {
                setError('File size exceeds 50MB limit');
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name.split('.')[0]);
            setError('');
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

    const handleAccessMemberToggle = (userId) => {
        setAccessMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file');
            return;
        }

        if (!fileName.trim()) {
            setError('File name is required');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_name', fileName);
            if (categoryId) formData.append('category_id', categoryId);
            if (tags) formData.append('tags', tags);
            if (accessMembers.length > 0) {
                formData.append('access_members', JSON.stringify(accessMembers));
            }

            const response = await filesAPI.upload(formData);

            if (response.data.success) {
                setFile(null);
                setFileName('');
                setCategoryId('');
                setTags('');
                setAccessMembers([]);
                setError('');
                onSuccess();
                onClose();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Upload File</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Select File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-input"
                                accept=".pdf,.png,.jpg,.jpeg,.docx"
                            />
                            <label htmlFor="file-input" className="cursor-pointer">
                                <Upload className="text-gray-400 mx-auto mb-2" size={32} />
                                <p className="text-gray-700 font-medium">
                                    {file ? file.name : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    PDF, PNG, JPG, JPEG, DOCX (Max 50MB)
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* File Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            File Name *
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter file name"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select or create category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowNewCategory(!showNewCategory)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. important, urgent, meeting"
                        />
                    </div>

                    {/* Access Members */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Grant Access To (Optional)
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                            {users.map(user => (
                                <label key={user._id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={accessMembers.includes(user._id)}
                                        onChange={() => handleAccessMemberToggle(user._id)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{user.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 You and admins get access automatically
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:bg-blue-400"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileUpload;
