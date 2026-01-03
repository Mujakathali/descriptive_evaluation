import { useState } from 'react';

const TeacherFileProcessor = ({ isOpen, onClose, onFileProcessed }) => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedContent, setExtractedContent] = useState([]);
    const [error, setError] = useState('');

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
        setExtractedContent([]);
    };

    const processFile = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');

        try {
            // Simulate file processing (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock extracted content for demonstration
            const mockContent = [
                {
                    id: 1,
                    question: "Explain the concept of machine learning and its applications.",
                    answer: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It involves algorithms that can identify patterns in data and make decisions with minimal human intervention. Applications include image recognition, natural language processing, recommendation systems, autonomous vehicles, and predictive analytics in various fields like healthcare, finance, and marketing."
                },
                {
                    id: 2,
                    question: "What are the main types of machine learning algorithms?",
                    answer: "The main types of machine learning algorithms are: 1) Supervised Learning - learns from labeled training data, 2) Unsupervised Learning - finds patterns in unlabeled data, 3) Reinforcement Learning - learns through trial and error with rewards and penalties, and 4) Semi-supervised Learning - combines supervised and unsupervised approaches using both labeled and unlabeled data."
                }
            ];

            setExtractedContent(mockContent);
        } catch (err) {
            setError('Failed to process file. Please check the file format and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (extractedContent.length > 0) {
            onFileProcessed(extractedContent[0]); // Use first question-answer pair
            onClose();
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">
                        Process Question & Answer File
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* File Upload Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Upload File</h3>

                        <div className="border-2 border-dashed border-border-light rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept=".pdf,.txt,.docx"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="teacher-file-input"
                            />
                            <label htmlFor="teacher-file-input" className="cursor-pointer">
                                <svg className="w-10 h-10 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-text-secondary mb-1">
                                    {file ? file.name : 'Click to upload or drag and drop'}
                                </p>
                                {file && (
                                    <p className="text-xs text-text-secondary">
                                        {formatFileSize(file.size)}
                                    </p>
                                )}
                            </label>
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={processFile}
                                disabled={!file || isProcessing}
                                className="w-full bg-academic-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing File...
                                    </span>
                                ) : (
                                    'Extract Questions & Answers'
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Supported Formats:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• PDF files with structured Q&A</li>
                                <li>• Plain text files</li>
                                <li>• Word documents (.docx)</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-2">
                                The system will automatically extract questions and model answers to train the evaluation model.
                            </p>
                        </div>
                    </div>

                    {/* Extracted Content Preview */}
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            Extracted Content {extractedContent.length > 0 && `(${extractedContent.length} pairs)`}
                        </h3>

                        {extractedContent.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {extractedContent.map((item, index) => (
                                    <div key={item.id} className="border border-border-light rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-academic-blue">
                                                Question {index + 1}
                                            </span>
                                            <button
                                                onClick={() => onFileProcessed(item)}
                                                className="text-sm text-academic-green hover:text-green-600 font-medium"
                                            >
                                                Use This
                                            </button>
                                        </div>
                                        <p className="text-sm text-text-primary mb-2 font-medium">
                                            {item.question}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {item.answer.substring(0, 150)}...
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No content extracted yet</p>
                                <p className="text-xs">Upload and process a file to see extracted questions and answers</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {extractedContent.length > 0 && (
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border-light">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-border-light text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-academic-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            Use First Question
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherFileProcessor;
