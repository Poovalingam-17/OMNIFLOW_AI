import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { uploadDocument, getDocuments, deleteDocument, Document } from '../../api/documentApi';

interface DocumentUploadProps {
  onUploadComplete: () => void;
  onClose?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [existingDocs, setExistingDocs] = useState<Document[]>([]);

  const fetchExistingDocs = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setExistingDocs(docs);
    } catch (err) {
      console.error('Failed to fetch existing documents', err);
    }
  }, []);

  useEffect(() => {
    fetchExistingDocs();
  }, [fetchExistingDocs]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setStatus('idle');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10485760, 
    multiple: false
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(0);

    let interval: any;

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (interval) clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      await uploadDocument(formData);
      if (interval) clearInterval(interval);
      setProgress(100);
      setStatus('complete');
      fetchExistingDocs();
      
      setTimeout(() => {
        setFiles([]);
        setStatus('idle');
        setProgress(0);
        onUploadComplete();
      }, 2000);

    } catch (error) {
      if (interval) clearInterval(interval);
      setStatus('error');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document? This will remove all its indexed vector chunks.')) {
      return;
    }
    try {
      await deleteDocument(id);
      fetchExistingDocs();
      onUploadComplete();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const removeFile = () => {
    setFiles([]);
    setStatus('idle');
  };

  return (
    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 relative overflow-hidden text-left shadow-xl animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 tracking-wide flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>Document Knowledge Base</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-slate-400 animate-pulse" />
        <p className="mt-3 text-sm text-slate-600 font-semibold">
          {isDragActive ? 'Release to upload...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Supports: PDF, DOCX, TXT (Max size: 10MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-450 font-medium">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={removeFile}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && !uploading && status === 'idle' && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full bg-btn-gradient hover:opacity-95 text-white py-2.5 px-4 rounded-xl font-semibold shadow-lg shadow-primary/10 active:scale-[0.99] transition cursor-pointer"
        >
          Upload & Index Document
        </button>
      )}

      {uploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Indexing contents and generating vector embeddings...</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2">
            <div
              className="bg-btn-gradient h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-sm text-emerald-650 font-semibold">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>Document vectorized and stored successfully!</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-sm text-rose-650 font-semibold">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>Failed to upload or parse document. Try again.</span>
        </div>
      )}

      {existingDocs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Indexed Documents ({existingDocs.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {existingDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-2.5 bg-slate-50/40 border border-slate-200/60 hover:border-slate-300 rounded-xl transition duration-150"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <File className="h-4 w-4 text-primary/80 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-[240px]" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {doc.chunkCount || 0} chunks • {doc.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
