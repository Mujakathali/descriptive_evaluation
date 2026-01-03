import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI } from '../services/api';

const FullPaperEvaluationPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        questions: '',
        modelAnswers: '',
        studentAnswers: '',
        marksPerQuestion: 10,
        semanticWeight: 70,
        conceptWeight: 30
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.questions.trim()) {
            newErrors.questions = 'Question paper is required';
        }

        if (!formData.modelAnswers.trim()) {
            newErrors.modelAnswers = 'Model answer key is required';
        }

        if (!formData.studentAnswers.trim()) {
            newErrors.studentAnswers = 'Student answer sheet is required';
        }

        if (!formData.marksPerQuestion || formData.marksPerQuestion <= 0) {
            newErrors.marksPerQuestion = 'Marks per question must be greater than 0';
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
            const result = await evaluationAPI.evaluateFullPaper({
                questions: formData.questions,
                model_answers: formData.modelAnswers,
                student_answers: formData.studentAnswers,
                marks_per_question: formData.marksPerQuestion,
                semantic_weight: formData.semanticWeight / 100,
                concept_weight: formData.conceptWeight / 100
            });

            navigate('/full-paper-results', { state: { result, formData } });
        } catch (error) {
            console.error('Evaluation error:', error);
            setErrors({ submit: error.response?.data?.detail || error.message || 'Failed to evaluate paper. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Full Paper Evaluation
                                </h1>
                                <p className="text-sm text-gray-500">Evaluate complete question papers at once</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Instructions Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-3 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Format Instructions
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-semibold mb-1">Questions:</p>
                            <p className="opacity-90">Number each question: 1. Question text 2. Question text...</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Model Answers:</p>
                            <p className="opacity-90">Match numbering: 1. Answer 2. Answer...</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Student Answers:</p>
                            <p className="opacity-90">Match numbering: 1. Answer 2. Answer...</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Questions Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Question Paper</h2>
                        </div>
                        <textarea
                            value={formData.questions}
                            onChange={(e) => handleInputChange('questions', e.target.value)}
                            className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${errors.questions ? 'border-red-500' : 'border-gray-200'}`}
                            rows={12}
                            placeholder="1. Explain photosynthesis.&#10;2. What is an operating system?&#10;3. Define machine learning."
                        />
                        {errors.questions && <p className="text-red-500 text-sm mt-2">{errors.questions}</p>}
                    </div>

                    {/* Model Answers Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Model Answer Key</h2>
                        </div>
                        <textarea
                            value={formData.modelAnswers}
                            onChange={(e) => handleInputChange('modelAnswers', e.target.value)}
                            className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm ${errors.modelAnswers ? 'border-red-500' : 'border-gray-200'}`}
                            rows={12}
                            placeholder="1. Photosynthesis is the process by which plants use sunlight to make food.&#10;2. An operating system is system software that manages hardware resources.&#10;3. Machine learning is a branch of AI that allows systems to learn from data."
                        />
                        {errors.modelAnswers && <p className="text-red-500 text-sm mt-2">{errors.modelAnswers}</p>}
                    </div>

                    {/* Student Answers Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Student Answer Sheet</h2>
                        </div>
                        <textarea
                            value={formData.studentAnswers}
                            onChange={(e) => handleInputChange('studentAnswers', e.target.value)}
                            className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm ${errors.studentAnswers ? 'border-red-500' : 'border-gray-200'}`}
                            rows={12}
                            placeholder="1. Photosynthesis is when plants prepare food using sunlight.&#10;2. An operating system controls computer programs.&#10;3. Machine learning is about computers becoming intelligent."
                        />
                        {errors.studentAnswers && <p className="text-red-500 text-sm mt-2">{errors.studentAnswers}</p>}
                    </div>
                </div>

                {/* Configuration Section */}
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Configuration</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Marks Per Question <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.marksPerQuestion}
                                onChange={(e) => handleInputChange('marksPerQuestion', parseFloat(e.target.value) || '')}
                                className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.marksPerQuestion ? 'border-red-500' : 'border-gray-200'}`}
                                min="0.5"
                                step="0.5"
                            />
                            {errors.marksPerQuestion && <p className="text-red-500 text-sm mt-1">{errors.marksPerQuestion}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Evaluation Weightage
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-600">Semantic Similarity</span>
                                        <span className="text-sm font-medium text-gray-800">{formData.semanticWeight}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.semanticWeight}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('semanticWeight', value);
                                            handleInputChange('conceptWeight', 100 - value);
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-600">Concept Coverage</span>
                                        <span className="text-sm font-medium text-gray-800">{formData.conceptWeight}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.conceptWeight}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('conceptWeight', value);
                                            handleInputChange('semanticWeight', 100 - value);
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 text-center">
                    {errors.submit && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    <button
                        onClick={handleEvaluate}
                        disabled={isLoading}
                        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Evaluating Paper...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Evaluate Full Paper
                            </span>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default FullPaperEvaluationPage;

