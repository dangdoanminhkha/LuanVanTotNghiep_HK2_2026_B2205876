import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { normalizeImageUrl } from '../utils/imageUrl';

const FILE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/upload';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fallback placeholder as inline SVG data URI to avoid external DNS dependency
const FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <rect width='100%' height='100%' fill='%23f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text>
  </svg>
`)}`;

const FileUpload = ({ onUploadSuccess, currentImage, folder = 'general' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(() => normalizeImageUrl(currentImage));
  const [error, setError] = useState('');
  const objectUrlRef = useRef('');

  useEffect(() => {
    const nextPreview = normalizeImageUrl(currentImage);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    setPreview(nextPreview);
  }, [currentImage]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn (tối đa 5MB)');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    objectUrlRef.current = localPreviewUrl;
    setPreview(localPreviewUrl);

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await axios.post(FILE_API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'any-value'
        }
      });

      if (response.data.success) {
        // Convert relative path to fullURL only for preview display
        const fullUrl = normalizeImageUrl(response.data.url);
        setPreview(fullUrl);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = '';
        }
        // Send relative path to backend, not fullURL
        onUploadSuccess(response.data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-4">
        {preview && (
          <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-gray-100">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_SVG;
                }}
            />
          </div>
        )}
        
        <label className="flex flex-col items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-600 hover:text-white transition-all duration-150">
          <span className="text-sm font-semibold">
            {uploading ? 'Đang tải...' : 'Chọn ảnh'}
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <p className="text-gray-500 text-[10px]">Tối đa 5MB. Định dạng: JPG, PNG, WebP</p>
    </div>
  );
};

export default FileUpload;
