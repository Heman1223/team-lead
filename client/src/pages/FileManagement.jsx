import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Eye, Download, Loader2, AlertCircle, MoreVertical, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import FileUpload from '../components/files/FileUpload';
import EditFileModal from '../components/files/EditFileModal';
import ManageAccessModal from '../components/files/ManageAccessModal';
import { filesAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * FileManagement Page
 * Displays and manages files with access control
 */
const FileManagement = () => {
    const { user: currentUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [managingAccessFile, setManagingAccessFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTags, setSelectedTags] = useState('');
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFiles();
        fetchCategories();
        fetchAllTags();
    }, []);

    const fetchFiles = async (query = '', category = '', tags = '') => {
        try {
            setLoading(true);
            const params = {};
            if (query) params.query = query;
            if (category) params.category_id = category;
            if (tags) params.tags = tags;

            const response = await filesAPI.getAll(params);
            setFiles(response.data.data || []);
        } catch (error) {
            setError('Error loading files');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTags = async () => {
        try {
            const response = await filesAPI.getAll({});
            const tagSet = new Set();
            (response.data.data || []).forEach(file => {
                if (file.tags) {
                    file.tags.forEach(tag => tagSet.add(tag));
                }
            });
            setAllTags(Array.from(tagSet));
        } catch (error) {
            console.error('Error fetching all tags:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterChange = () => {
        fetchFiles(searchQuery, selectedCategory, selectedTags);
    };

    useEffect(() => {
        handleFilterChange();
    }, [searchQuery, selectedCategory, selectedTags]);

    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            await filesAPI.delete(fileId);
            setFiles(files.filter(f => f._id !== fileId));
        } catch (error) {
            setError('Error deleting file');
        }
    };

    const getFileIcon = (fileType) => {
        const icons = {
            pdf: '📄',
            png: '🖼️',
            jpg: '🖼️',
            jpeg: '🖼️',
            docx: '📝'
        };
        return icons[fileType] || '📦';
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-4 md:p-6 min-h-screen">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">File Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Upload, organize, and share files securely</p>
                    </div>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg font-semibold"
                    >
                        <Upload size={18} />
                        Upload File
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search files by name, tags, or description..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tags
                            </label>
                            <select
                                value={selectedTags}
                                onChange={(e) => setSelectedTags(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Results Count */}
                        <div className="flex items-end">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{files.length}</span> files
                            </p>
                        </div>
                    </div>
                </div>

                {/* Files Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-16 text-center">
                            <p className="text-gray-500 text-lg">No files found</p>
                            <p className="text-gray-400 text-sm mt-2">Upload your first file to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-visible">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">File Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tags</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Uploaded By</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {files.map(file => (
                                        <FileRow
                                            key={file._id}
                                            file={file}
                                            currentUser={currentUser}
                                            getFileIcon={getFileIcon}
                                            onDelete={handleDelete}
                                            onEdit={(file) => setEditingFile(file)}
                                            onManageAccess={(file) => setManagingAccessFile(file)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                <FileUpload
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    onSuccess={() => {
                        fetchFiles(searchQuery, selectedCategory, selectedTags);
                        fetchCategories();
                        fetchAllTags();
                    }}
                />

                {/* Edit Modal */}
                <EditFileModal
                    isOpen={!!editingFile}
                    onClose={() => setEditingFile(null)}
                    file={editingFile}
                    onSuccess={() => {
                        fetchFiles(searchQuery, selectedCategory, selectedTags);
                        fetchAllTags();
                    }}
                />

                {/* Manage Access Modal */}
                <ManageAccessModal
                    isOpen={!!managingAccessFile}
                    onClose={() => setManagingAccessFile(null)}
                    file={managingAccessFile}
                    onSuccess={() => fetchFiles(searchQuery, selectedCategory, selectedTags)}
                />
            </div>
        </Layout>
    );
};

/**
 * FileRow Component
 * Individual file row with actions
 */
const FileRow = ({ file, currentUser, getFileIcon, onDelete, onEdit, onManageAccess }) => {
    const [showActions, setShowActions] = useState(false);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                    <div>
                        <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium truncate"
                        >
                            {file.file_name}
                        </a>
                        <p className="text-xs text-gray-500">{file.file_type.toUpperCase()}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700">
                    {file.category_id?.category_name || '-'}
                </p>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {file.tags && file.tags.length > 0 ? (
                        file.tags.map(tag => (
                            <span
                                key={tag}
                                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">-</p>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700">{file.uploaded_by?.name}</p>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700">{formatDate(file.upload_date)}</p>
            </td>
            <td className="px-6 py-4">
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showActions && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowActions(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[150px]">
                                <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 w-full text-left"
                                >
                                    <Eye size={16} />
                                    View
                                </a>

                                {(currentUser.role === 'admin' || currentUser._id === file.uploaded_by?._id) && (
                                    <button
                                        onClick={() => {
                                            onManageAccess(file);
                                            setShowActions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <Shield size={16} />
                                        Manage Access
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        onEdit(file);
                                        setShowActions(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        const handleDownload = async () => {
                                            try {
                                                // Make a secure API request to the backend download proxy
                                                const response = await filesAPI.download(file._id);
                                                
                                                // Extract blob data directly from Axios response
                                                const blob = response.data;
                                                const blobUrl = window.URL.createObjectURL(blob);
                                                
                                                // Prepare the filename with the correct extension
                                                let fileName = file.file_name || 'download';
                                                if (file.file_type && !fileName.toLowerCase().endsWith(`.${file.file_type.toLowerCase()}`)) {
                                                    fileName = `${fileName}.${file.file_type}`;
                                                }

                                                // Create a temporary anchor and trigger download
                                                const link = document.createElement('a');
                                                link.href = blobUrl;
                                                link.download = fileName;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(blobUrl);

                                            } catch (error) {
                                                console.error("Download failed:", error);
                                                alert("Failed to initiate download. Please try again.");
                                            }
                                        };
                                        handleDownload();
                                        setShowActions(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(file._id);
                                        setShowActions(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default FileManagement;
