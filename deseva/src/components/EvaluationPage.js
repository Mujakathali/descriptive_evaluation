import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI } from '../services/api';
import { extractTextFromFile } from '../utils/documentText';
import FileUpload from './FileUpload';
import TeacherFileProcessor from './TeacherFileProcessor';

const EvaluationPage = () => {
    const navigate = useNavigate();

    const [teacherData, setTeacherData] = useState({
        question: '',
        modelAnswer: '',
        maxMarks: 10,
        semanticWeight: 70,
        conceptWeight: 30
    });

    const [studentAnswer, setStudentAnswer] = useState('');
    const [teacherQuestionFile, setTeacherQuestionFile] = useState(null);
    const [teacherModelAnswerFile, setTeacherModelAnswerFile] = useState(null);
    const [teacherFile, setTeacherFile] = useState(null);
    const [studentFile, setStudentFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isProcessingTeacherFile, setIsProcessingTeacherFile] = useState(false);
    const [showTeacherProcessor, setShowTeacherProcessor] = useState(false);
    const [isExtractingTeacherQuestion, setIsExtractingTeacherQuestion] = useState(false);
    const [isExtractingTeacherModelAnswer, setIsExtractingTeacherModelAnswer] = useState(false);
    const [teacherExtractError, setTeacherExtractError] = useState('');
    const [isExtractingStudentText, setIsExtractingStudentText] = useState(false);
    const [studentExtractStatus, setStudentExtractStatus] = useState(null);
    const [studentExtractError, setStudentExtractError] = useState('');

    const validateForm = () => {
        const newErrors = {};

        if (isExtractingStudentText || isExtractingTeacherQuestion || isExtractingTeacherModelAnswer) {
            newErrors.studentAnswer = 'Please wait until the uploaded answer sheet text is extracted.';
        }

        if (!teacherData.question.trim() && !teacherQuestionFile && !teacherFile) {
            newErrors.question = 'Question is required (either text or file)';
        }

        if (!teacherData.modelAnswer.trim() && !teacherModelAnswerFile && !teacherFile) {
            newErrors.modelAnswer = 'Model answer is required (either text or file)';
        }

        if (!teacherData.maxMarks || teacherData.maxMarks <= 0) {
            newErrors.maxMarks = 'Maximum marks must be greater than 0';
        }

        if (!studentAnswer.trim() && !studentFile) {
            newErrors.studentAnswer = 'Student answer is required (either text or file)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEvaluate = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Prepare data for API
            const formData = new FormData();

            // Add text data
            formData.append('question', teacherData.question);
            formData.append('modelAnswer', teacherData.modelAnswer);
            formData.append('studentAnswer', studentAnswer);
            formData.append('maxMarks', teacherData.maxMarks);
            formData.append('semanticWeight', teacherData.semanticWeight / 100);
            formData.append('conceptWeight', teacherData.conceptWeight / 100);

            // Add files if present
            if (teacherQuestionFile) {
                formData.append('teacherQuestionFile', teacherQuestionFile);
            }
            if (teacherModelAnswerFile) {
                formData.append('teacherModelAnswerFile', teacherModelAnswerFile);
            }
            if (teacherFile) {
                formData.append('teacherFile', teacherFile);
            }
            if (studentFile) {
                formData.append('studentFile', studentFile);
            }

            // Call the evaluation API with FormData
            const result = await evaluationAPI.evaluateAnswer(formData);

            // Navigate to results page with data
            navigate('/results', { state: { result, teacherData, studentAnswer } });

        } catch (error) {
            console.error('Evaluation error:', error);
            setErrors({ submit: error.message || 'Failed to evaluate answer. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeacherQuestionFileSelect = async (file) => {
        setTeacherQuestionFile(file);
        setTeacherExtractError('');

        if (!file) {
            return;
        }

        setIsExtractingTeacherQuestion(true);
        try {
            const extracted = await extractTextFromFile(file, { maxPagesForOcr: 2 });
            if (!extracted) {
                setTeacherExtractError('No text could be extracted from the teacher question file.');
                return;
            }
            setTeacherData(prev => ({ ...prev, question: extracted }));
        } catch (e) {
            setTeacherExtractError(e?.message || 'Failed to extract text from teacher question file.');
        } finally {
            setIsExtractingTeacherQuestion(false);
        }
    };

    const handleTeacherModelAnswerFileSelect = async (file) => {
        setTeacherModelAnswerFile(file);
        setTeacherExtractError('');

        if (!file) {
            return;
        }

        setIsExtractingTeacherModelAnswer(true);
        try {
            const extracted = await extractTextFromFile(file, { maxPagesForOcr: 2 });
            if (!extracted) {
                setTeacherExtractError('No text could be extracted from the teacher model answer file.');
                return;
            }
            setTeacherData(prev => ({ ...prev, modelAnswer: extracted }));
        } catch (e) {
            setTeacherExtractError(e?.message || 'Failed to extract text from teacher model answer file.');
        } finally {
            setIsExtractingTeacherModelAnswer(false);
        }
    };

    const handleInputChange = (field, value) => {
        setTeacherData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleTeacherFileSelect = async (file) => {
        if (!file) {
            setTeacherFile(null);
            return;
        }

        setIsProcessingTeacherFile(true);
        try {
            // Process teacher file to extract questions and answers
            const formData = new FormData();
            formData.append('file', file);

            // API call to process teacher file and train model
            const response = await evaluationAPI.processTeacherFile(formData);

            // Update teacher data with extracted content
            if (response.questions && response.questions.length > 0) {
                setTeacherData(prev => ({
                    ...prev,
                    question: response.questions[0].question || '',
                    modelAnswer: response.questions[0].answer || ''
                }));
            }

            setTeacherFile(file);
        } catch (error) {
            console.error('Error processing teacher file:', error);
            setErrors({ teacherFile: 'Failed to process teacher file. Please check the file format.' });
        } finally {
            setIsProcessingTeacherFile(false);
        }
    };

    const handleStudentFileSelect = async (file) => {
        setStudentFile(file);
        setStudentExtractError('');
        setStudentExtractStatus(null);

        // Clear student answer text when file is selected
        setStudentAnswer('');
        if (errors.studentAnswer) {
            setErrors(prev => ({ ...prev, studentAnswer: '' }));
        }

        if (!file) {
            return;
        }

        // Extract text from file (PDF text layer OR OCR fallback)
        setIsExtractingStudentText(true);
        try {
            const extracted = await extractTextFromFile(file, {
                maxPagesForOcr: 2,
                onProgress: (p) => setStudentExtractStatus(p),
            });

            if (!extracted) {
                setStudentExtractError('No text could be extracted from the uploaded file.');
                return;
            }

            setStudentAnswer(extracted);
        } catch (e) {
            setStudentExtractError(e?.message || 'Failed to extract text from file.');
        } finally {
            setIsExtractingStudentText(false);
        }
    };

    const handleProcessedTeacherFile = (processedData) => {
        setTeacherData(prev => ({
            ...prev,
            question: processedData.question || '',
            modelAnswer: processedData.answer || ''
        }));
        setTeacherFile({ name: 'processed-file', processed: true });
    };

    return (
        <div className="min-h-screen bg-light-bg">
            {/* Header */}
            <header className="bg-white border-b border-border-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-text-primary">Answer Evaluation</h1>
                        </div>
                        <div className="text-sm text-text-secondary">
                            DeSeva - Automated Evaluation System
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Teacher Input Section */}
                    <div className="bg-white p-6 rounded-xl card-shadow">
                        <div className="flex items-center mb-6">
                            <div className="w-8 h-8 bg-academic-blue rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-text-primary">Teacher Input</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Question <span className="text-red-500">*</span>
                                </label>
                                <div className="mb-3">
                                    <FileUpload
                                        label="Upload Question (PDF/Image)"
                                        onFileSelect={handleTeacherQuestionFileSelect}
                                        acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                                        maxSize={10 * 1024 * 1024}
                                        preview={true}
                                    />
                                    {isExtractingTeacherQuestion && (
                                        <div className="mt-2 text-xs text-academic-blue flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-academic-blue" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Extracting question text...
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    value={teacherData.question}
                                    onChange={(e) => handleInputChange('question', e.target.value)}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-academic-blue focus:border-transparent resize-none ${errors.question ? 'border-red-500' : 'border-border-light'
                                        }`}
                                    rows={3}
                                    placeholder="Enter the question..."
                                />
                                {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Model Answer <span className="text-red-500">*</span>
                                </label>
                                <div className="mb-3">
                                    <FileUpload
                                        label="Upload Model Answer (PDF/Image)"
                                        onFileSelect={handleTeacherModelAnswerFileSelect}
                                        acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                                        maxSize={10 * 1024 * 1024}
                                        preview={true}
                                    />
                                    {isExtractingTeacherModelAnswer && (
                                        <div className="mt-2 text-xs text-academic-blue flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-academic-blue" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Extracting model answer text...
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    value={teacherData.modelAnswer}
                                    onChange={(e) => handleInputChange('modelAnswer', e.target.value)}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-academic-blue focus:border-transparent resize-none ${errors.modelAnswer ? 'border-red-500' : 'border-border-light'
                                        }`}
                                    rows={5}
                                    placeholder="Enter the ideal/model answer..."
                                />
                                {errors.modelAnswer && <p className="text-red-500 text-sm mt-1">{errors.modelAnswer}</p>}
                            </div>

                            {teacherExtractError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{teacherExtractError}</p>
                                    <p className="text-red-500 text-xs mt-1">
                                        Tip: If this is a scanned/handwritten PDF, OCR quality depends on scan clarity.
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-border-light pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-text-primary">
                                        Upload Question & Answer File
                                    </label>
                                    <button
                                        onClick={() => setShowTeacherProcessor(true)}
                                        className="text-xs text-academic-blue hover:text-blue-600 font-medium flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Advanced Processing
                                    </button>
                                </div>

                                <FileUpload
                                    label=""
                                    onFileSelect={handleTeacherFileSelect}
                                    acceptedTypes={['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                                    maxSize={10 * 1024 * 1024} // 10MB
                                    className="mb-2"
                                />

                                <p className="text-xs text-text-secondary">
                                    Upload a file containing questions and model answers (PDF, TXT, DOCX).
                                    The system will extract content and train the evaluation model.
                                </p>

                                {errors.teacherFile && (
                                    <p className="text-red-500 text-sm mt-2">{errors.teacherFile}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Maximum Marks <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={teacherData.maxMarks}
                                    onChange={(e) => handleInputChange('maxMarks', parseInt(e.target.value) || '')}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-academic-blue focus:border-transparent ${errors.maxMarks ? 'border-red-500' : 'border-border-light'
                                        }`}
                                    min="1"
                                    placeholder="Enter maximum marks"
                                />
                                {errors.maxMarks && <p className="text-red-500 text-sm mt-1">{errors.maxMarks}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Evaluation Weightage
                                </label>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-text-secondary">Semantic Similarity</span>
                                            <span className="text-sm font-medium text-text-primary">{teacherData.semanticWeight}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={teacherData.semanticWeight}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                handleInputChange('semanticWeight', value);
                                                handleInputChange('conceptWeight', 100 - value);
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-academic-blue"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-text-secondary">Concept Coverage</span>
                                            <span className="text-sm font-medium text-text-primary">{teacherData.conceptWeight}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={teacherData.conceptWeight}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                handleInputChange('conceptWeight', value);
                                                handleInputChange('semanticWeight', 100 - value);
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-academic-green"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Answer Section */}
                    <div className="bg-white p-6 rounded-xl card-shadow">
                        <div className="flex items-center mb-6">
                            <div className="w-8 h-8 bg-academic-green rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-text-primary">Student Answer</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Answer Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={studentAnswer}
                                    onChange={(e) => {
                                        setStudentAnswer(e.target.value);
                                        if (errors.studentAnswer) {
                                            setErrors(prev => ({ ...prev, studentAnswer: '' }));
                                        }
                                    }}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-academic-green focus:border-transparent resize-none ${errors.studentAnswer ? 'border-red-500' : 'border-border-light'
                                        }`}
                                    rows={8}
                                    placeholder="Enter the student's answer..."
                                />
                                {errors.studentAnswer && <p className="text-red-500 text-sm mt-1">{errors.studentAnswer}</p>}
                            </div>

                            <div className="border-t border-border-light pt-4">
                                <label className="block text-sm font-medium text-text-primary mb-3">
                                    Upload Answer Sheet
                                </label>

                                <FileUpload
                                    label=""
                                    onFileSelect={handleStudentFileSelect}
                                    acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                                    maxSize={15 * 1024 * 1024} // 15MB for student sheets
                                    preview={true}
                                    className="mb-3"
                                />

                                {isExtractingStudentText && (
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center text-sm text-blue-700">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Extracting text from uploaded file...
                                        </div>
                                        {studentExtractStatus?.phase && (
                                            <div className="text-xs text-blue-600 mt-2">
                                                {studentExtractStatus.phase === 'pdf_text' && (
                                                    <span>Reading PDF text layer (page {studentExtractStatus.page}/{studentExtractStatus.total})</span>
                                                )}
                                                {studentExtractStatus.phase === 'pdf_ocr_render' && (
                                                    <span>Preparing OCR (page {studentExtractStatus.page}/{studentExtractStatus.total})</span>
                                                )}
                                                {studentExtractStatus.phase === 'pdf_ocr' && (
                                                    <span>Running OCR (page {studentExtractStatus.page}/{studentExtractStatus.total})</span>
                                                )}
                                                {studentExtractStatus.phase === 'pdf_ocr_progress' && (
                                                    <span>OCR progress (page {studentExtractStatus.page}/{studentExtractStatus.total}): {Math.round((studentExtractStatus.progress || 0) * 100)}%</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {studentExtractError && (
                                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{studentExtractError}</p>
                                        <p className="text-red-500 text-xs mt-1">
                                            Tip: If this is a scanned/handwritten PDF, OCR may be slow and depends on scan quality.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <button className="w-full py-2 px-4 border border-border-light rounded-lg text-sm text-text-primary hover:bg-gray-50 transition-colors flex items-center justify-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Scan Answer Sheet
                                    </button>

                                    <button className="w-full py-2 px-4 border border-border-light rounded-lg text-sm text-text-primary hover:bg-gray-50 transition-colors flex items-center justify-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                        Voice Recording (Coming Soon)
                                    </button>
                                </div>

                                <p className="text-xs text-text-secondary mt-3">
                                    Upload handwritten answer sheets (PDF, JPG, PNG) or use text input above.
                                    The system will process and evaluate the uploaded answer sheet.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 text-center">
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    <button
                        onClick={handleEvaluate}
                        disabled={isLoading || isExtractingStudentText || isExtractingTeacherQuestion || isExtractingTeacherModelAnswer}
                        className={`bg-academic-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${(isLoading || isExtractingStudentText || isExtractingTeacherQuestion || isExtractingTeacherModelAnswer) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {(isExtractingStudentText || isExtractingTeacherQuestion || isExtractingTeacherModelAnswer) ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Extracting Text...
                            </span>
                        ) : isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Evaluating Answer...
                            </span>
                        ) : (
                            'Evaluate Answer'
                        )}
                    </button>
                </div>
            </main>

            {/* Teacher File Processor Modal */}
            <TeacherFileProcessor
                isOpen={showTeacherProcessor}
                onClose={() => setShowTeacherProcessor(false)}
                onFileProcessed={handleProcessedTeacherFile}
            />
        </div>
    );
};

export default EvaluationPage;
