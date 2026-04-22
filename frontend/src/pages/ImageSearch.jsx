import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ImageSearch() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [productDetails, setProductDetails] = useState({});
    const [threshold, setThreshold] = useState(60);
    const [error, setError] = useState('');
    const [fetchingDetails, setFetchingDetails] = useState(false);

    // Fetch product details khi có results
    useEffect(() => {
        if (results && results.status === 'success' && results.results.length > 0) {
            fetchProductDetails();
        }
    }, [results]);

    const fetchProductDetails = async () => {
        setFetchingDetails(true);
        const details = {};
        
        for (const item of results.results) {
            try {
                const res = await api.get(`/products/base/${item.product_id}`);
                details[item.product_id] = res.data;
            } catch (err) {
                console.error(`Error fetching product ${item.product_id}:`, err);
            }
        }
        
        setProductDetails(details);
        setFetchingDetails(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(file.type)) {
            setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Kích thước ảnh không được vượt quá 10MB');
            return;
        }

        setImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
        setError('');
        setResults(null);
    };

    const handleSearch = async () => {
        if (!image) {
            setError('Vui lòng chọn ảnh để tìm kiếm');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('threshold', (threshold / 100).toFixed(2));
        formData.append('top_n', '100');

        try {
            const response = await api.post('/products/search-by-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResults(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi tìm kiếm. Vui lòng thử lại.');
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setImage(null);
        setPreview(null);
        setResults(null);
        setError('');
        setThreshold(60);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Tìm kiếm sản phẩm bằng hình ảnh
                    </h1>
                    <p className="text-gray-600">
                        Chụp ảnh hoặc tải lên hình ảnh sản phẩm để tìm kiếm
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Upload Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                            Chọn hoặc kéo thả ảnh
                        </label>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = e.dataTransfer.files;
                                if (files.length > 0) {
                                    handleImageSelect({ target: { files } });
                                }
                            }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="image-input"
                            />
                            <label htmlFor="image-input" className="cursor-pointer block">
                                <p className="text-gray-700 font-medium">Nhấp để chọn ảnh</p>
                                <p className="text-sm text-gray-500">hoặc kéo thả ảnh vào đây</p>
                            </label>
                        </div>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="mb-8 text-center">
                            <p className="text-sm text-gray-600 mb-2">Ảnh được chọn:</p>
                            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSearch}
                            disabled={!image || loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition"
                        >
                            {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                        </button>
                        {(image || results) && (
                            <button
                                onClick={handleReset}
                                className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                            >
                                Xóa
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {results && (
                    <div className="mt-12">
                        {results.status === 'success' && results.results.length > 0 ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                    Kết quả tìm kiếm ({Array.from(new Set(results.results.map(r => r.product_id))).length})
                                </h2>
                                {fetchingDetails && (
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                        <p className="text-blue-700">⏳ Đang tải thông tin sản phẩm...</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from(new Set(results.results.map(r => r.product_id))).map((productId) => {
                                        const product = productDetails[productId];
                                        // Get highest similarity for this product
                                        const maxSimilarity = Math.max(...results.results.filter(r => r.product_id === productId).map(r => r.similarity));
                                        
                                        // Get first variant's first image
                                        const firstVariant = product?.variants?.[0];
                                        // Try angle 1 first, then fallback to any image, then fallback to product.image
                                        const imageUrl = firstVariant?.images?.find(img => img.angle === 1)?.image_url 
                                          || firstVariant?.images?.[0]?.image_url
                                          || product?.image;
                                        // Get color - try multiple possible field names
                                        const variantColor = firstVariant?.color || firstVariant?.name || '';
                                        const displayName = variantColor && variantColor.trim() ? `${product?.name} ${variantColor}` : product?.name;
                                        
                                        return (
                                            <div
                                                key={productId}
                                                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                                            >
                                                {/* Product Image */}
                                                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={displayName}
                                                            className="w-full h-full object-contain hover:scale-105 transition"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {/* Similarity Badge */}
                                                    <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold shadow">
                                                        {(maxSimilarity * 100).toFixed(1)}%
                                                    </div>
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                        {displayName || `Sản phẩm #${productId}`}
                                                    </h3>
                                                    
                                                    {product?.price && (
                                                        <p className="text-lg font-bold text-blue-600 mb-3">
                                                            {new Intl.NumberFormat('vi-VN', {
                                                                style: 'currency',
                                                                currency: 'VND',
                                                            }).format(product.price)}
                                                        </p>
                                                    )}

                                                    {/* Similarity Bar */}
                                                    <div className="mb-4">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${maxSimilarity * 100}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Độ khớp: {(maxSimilarity * 100).toFixed(1)}%
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => window.open(`/products/${productId}`, '_blank')}
                                                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : results.status === 'not_found' ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                                <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-4a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Không tìm thấy</h3>
                                <p className="text-yellow-800">{results.message}</p>
                                <p className="text-sm text-yellow-700 mt-3">
                                    Hãy thử giảm ngưỡng độ khớp hoặc chọn ảnh khác
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <p className="text-red-700">{results.message || 'Có lỗi xảy ra'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
