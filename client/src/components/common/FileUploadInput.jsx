import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw, X, Database, Link as LinkIcon } from 'lucide-react';
import api from '../../services/api';

/**
 * Reusable computer file upload component that saves files directly to Aiven MySQL.
 * Strictly adheres to zero-emoji policy.
 */
const FileUploadInput = ({
  label,
  value,
  onChange,
  accept = '.pdf,.zip,.ppt,.pptx,.doc,.docx,.xlsx,.png,.jpg',
  category = 'GENERAL',
  required = false,
  helperText,
  disabled = false,
  allowExternalUrl = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [showUrlMode, setShowUrlMode] = useState(false);

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check file size (50MB limit)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage('File size exceeds the 50MB limit.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (response.data && response.data.downloadUrl) {
        setUploadedFileInfo({
          id: response.data.fileId,
          name: response.data.fileName,
          size: response.data.fileSize,
          type: response.data.fileType,
          viewUrl: response.data.viewUrl,
          downloadUrl: response.data.downloadUrl,
        });

        // Trigger parent onChange with downloadUrl and full file info
        onChange(response.data.downloadUrl, response.data);
      } else {
        setErrorMessage('File upload completed but no valid file URL was returned.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to persist file in database.';
      setErrorMessage('Upload error: ' + serverMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClear = () => {
    setUploadedFileInfo(null);
    setErrorMessage('');
    onChange('', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDatabaseFile = value && value.startsWith('/api/files/');

  return (
    <div className="w-full space-y-1.5">
      {/* Label and mode switcher */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {allowExternalUrl && (
          <button
            type="button"
            onClick={() => setShowUrlMode(!showUrlMode)}
            className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
          >
            {showUrlMode ? (
              <>
                <UploadCloud className="w-3 h-3" />
                Upload from Computer
              </>
            ) : (
              <>
                <LinkIcon className="w-3 h-3" />
                Paste External URL
              </>
            )}
          </button>
        )}
      </div>

      {showUrlMode ? (
        /* Direct URL input fallback */
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value, null)}
              placeholder="https://example.com/document.pdf"
              disabled={disabled}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Pasting external link directly. Switch above to upload from local disk to Aiven MySQL.
          </p>
        </div>
      ) : (
        /* Computer File Upload Box */
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={onFileInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {value ? (
            /* Uploaded State Card */
            <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {uploadedFileInfo?.name || (isDatabaseFile ? 'Attached Document' : value)}
                    </p>
                    {isDatabaseFile ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Database className="w-2.5 h-2.5" />
                        Saved in Aiven MySQL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        External Link
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {uploadedFileInfo?.size ? formatFileSize(uploadedFileInfo.size) : 'Ready for submission'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 flex items-center gap-1 transition-colors"
                  title="View / Download File"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View</span>
                </a>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
                  title="Upload different file from computer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled || isUploading}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Dropzone / Upload Trigger */
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer text-center ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/20'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Aiven MySQL ({uploadProgress}%)...</span>
                  </div>
                  <div className="w-full max-w-xs mx-auto bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Writing binary content to cloud database</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Click to browse from your computer
                    </span>{' '}
                    <span className="text-xs text-slate-500 dark:text-slate-400">or drag and drop</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Direct upload to Aiven MySQL</span>
                    <span>•</span>
                    <span>Max 50MB</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Helper Text */}
          {helperText && !errorMessage && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadInput;
