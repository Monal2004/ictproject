'use client';

import React, { useState, useRef } from 'react';
import { ComplaintAttachment } from '@/lib/types/complaint';
import { validateImageFile, createThumbnailAttachment } from '@/lib/utils/imageUtils';
import { UploadCloud, X, ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadDropzoneProps {
  onAttachmentChange: (attachment?: ComplaintAttachment) => void;
  attachment?: ComplaintAttachment;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onAttachmentChange,
  attachment,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setProcessing(true);
      const compressed = await createThumbnailAttachment(file);
      onAttachmentChange(compressed);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not process the image. Please try another file.');
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    onAttachmentChange(undefined);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800">
        Attach Photo <span className="text-xs font-normal text-slate-500">(Optional)</span>
      </label>

      {attachment?.thumbnailDataUrl ? (
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.thumbnailDataUrl}
              alt="Uploaded photo preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{attachment.name}</p>
            <p className="text-xs text-slate-500">
              Compressed for browser storage ({Math.round(attachment.size / 1024)} KB original)
            </p>
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove photo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-emerald-600 bg-emerald-50/50'
              : 'border-slate-300 hover:border-emerald-600 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileSelect}
          />
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
            {processing ? (
              <div className="w-5 h-5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud size={20} />
            )}
          </div>
          <p className="text-sm font-medium text-slate-700">
            {processing ? 'Compressing photo...' : 'Click to upload or drag & drop'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WebP up to 3MB</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
