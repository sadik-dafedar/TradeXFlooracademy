'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Video, FileText, MoreVertical, X, Check, Upload, Banknote, Clock, Users, Pencil } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PdfUploader from '@/components/admin/PdfUploader';
import ThumbnailGenerator from '@/components/admin/ThumbnailGenerator';

export default function ProductsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [productList, setProductList] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'VIDEO_COURSE',
        price: '',
        contentUrl: '',
        thumbnail: '',
        validityDays: 90
    });

    const fetchProducts = async () => {
        setFetchLoading(true);
        try {
            const res = await fetch('/api/admin/products', {
                credentials: 'include'
            });
            if (res.ok) setProductList(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const resetForm = () => {
        setFormData({ title: '', description: '', type: 'VIDEO_COURSE', price: '', contentUrl: '', thumbnail: '', validityDays: 90 });
        setEditingProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingProduct
                ? `/api/admin/products/${editingProduct.id}`
                : '/api/admin/products';
            const method = editingProduct ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save product');
            }

            resetForm();
            fetchProducts();
            router.refresh();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            description: product.description || '',
            type: product.type,
            price: product.price.toString(),
            contentUrl: product.contentUrl,
            thumbnail: product.thumbnail || '',
            validityDays: product.validityDays
        });
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(productId);
        try {
            const res = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete product');
            }

            fetchProducts();
        } catch (error) {
            alert(error.message);
        } finally {
            setDeleteLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Course Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">
                                {editingProduct ? 'Edit Course' : 'Add New Course'}
                            </h2>
                            {editingProduct && (
                                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter course title"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                    placeholder="Course details..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'VIDEO_COURSE', validityDays: 90 })}
                                        className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border ${formData.type === 'VIDEO_COURSE'
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        <Video size={14} /> Video Course
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'PDF_RESOURCE', validityDays: 3650 })}
                                        className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border ${formData.type === 'PDF_RESOURCE'
                                            ? 'bg-purple-600 border-purple-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        <FileText size={14} /> PDF Resource
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Price</label>
                                    <input
                                        type="number" required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Validity (Days)</label>
                                    <input
                                        type="number" required
                                        value={formData.validityDays}
                                        onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="90"
                                    />
                                </div>
                            </div>

                            {/* Content & Thumbnail Section */}
                            {formData.type === 'PDF_RESOURCE' ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">PDF File</label>
                                    <div className="space-y-4">
                                        <PdfUploader
                                            onUploadComplete={(url, name) => {
                                                setFormData(prev => ({ ...prev, contentUrl: url }));
                                            }}
                                            onThumbnailGenerated={(url) => {
                                                setFormData(prev => ({ ...prev, thumbnail: url }));
                                            }}
                                        />
                                        {formData.contentUrl && (
                                            <div className="text-xs text-green-400 flex items-center gap-1">
                                                <FileText size={12} />
                                                Current: {formData.contentUrl.split('/').pop()}
                                            </div>
                                        )}
                                    </div>
                                    <input type="hidden" value={formData.contentUrl} required />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Video URL / ID</label>
                                        <input
                                            type="text" required
                                            value={formData.contentUrl}
                                            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="Enter VdoCipher ID or Video URL"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Thumbnail</label>
                                        <ThumbnailGenerator
                                            contentType="video"
                                            contentUrl={formData.contentUrl}
                                            currentThumbnail={formData.thumbnail}
                                            onThumbnailSelect={(url) => {
                                                setFormData(prev => ({ ...prev, thumbnail: url }));
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Clock className="animate-spin" size={16} /> : editingProduct ? 'Update Course' : 'Create Course'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">All Courses</h2>
                            <span className="text-xs font-medium text-gray-500 bg-gray-800 px-2 py-1 rounded">Total: {productList.length}</span>
                        </div>

                        {fetchLoading ? (
                            <div className="p-10 flex flex-col items-center text-gray-500">
                                <Clock className="animate-spin mb-2" />
                                <span className="text-sm">Loading inventory...</span>
                            </div>
                        ) : productList.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">No courses found. Add one to get started.</div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {productList.map(product => (
                                    <div key={product.id} className="p-4 hover:bg-gray-800/50 transition-colors flex items-start justify-between group">
                                        <div className="flex gap-4">
                                            {product.thumbnail ? (
                                                <Image
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    width={64}
                                                    height={64}
                                                    unoptimized
                                                    className="object-cover rounded-lg border border-gray-700 bg-gray-900 shrink-0"
                                                />
                                            ) : (
                                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 ${product.type === 'VIDEO_COURSE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'
                                                    }`}>
                                                    {product.type === 'VIDEO_COURSE' ? <Video size={24} /> : <FileText size={24} />}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-white">{product.title}</h3>
                                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                                                    <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 font-mono">₹{product.price}</span>
                                                    <span>{product.validityDays} days validity</span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {product._count?.subscriptions || 0} enrolled
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-400 rounded-lg transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
