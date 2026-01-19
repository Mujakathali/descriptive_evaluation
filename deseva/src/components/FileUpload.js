import { useRef, useState } from 'react';

const FileUpload = ({
    label,
    onFileSelect,
    acceptedTypes,
    maxSize = 5 * 1024 * 1024, // 5MB default
    className = '',
    preview = false
}) => {
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setError('');

        // Validate file type
        if (acceptedTypes && !acceptedTypes.includes(file.type)) {
            setError(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
            return;
        }

        // Validate file size
        if (file.size > maxSize) {
            setError(`File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
            return;
        }

        setSelectedFile(file);
        onFileSelect(file);
    };

    const removeFile = () => {
        setSelectedFile(null);
        setError('');
        onFileSelect(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium text-text-primary mb-2">
                {label}
            </label>

            {!selectedFile ? (
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                        ? 'border-academic-blue bg-blue-50'
                        : 'border-border-light hover:border-academic-green hover:bg-gray-50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={inputRef}
                        className="hidden"
                        accept={acceptedTypes?.join(',')}
                        onChange={handleFileInput}
                    />

                    <svg
                        className="w-10 h-10 text-text-secondary mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    <p className="text-sm text-text-secondary mb-1">
                        Drag and drop your file here, or click to browse
                    </p>

                    <p className="text-xs text-text-secondary">
                        {acceptedTypes ? `Accepted: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}` : 'All file types'}
                        {' • '}
                        Max size: {Math.round(maxSize / 1024 / 1024)}MB
                    </p>
                </div>
            ) : (
                <div className="border border-border-light rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-academic-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-academic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary truncate max-w-xs">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={removeFile}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {preview && selectedFile.type.startsWith('image/') && (
                        <div className="mt-3">
                            <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                            />
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
        </div>
    );
};

export default FileUpload;
