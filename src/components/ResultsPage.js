import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showExplainability, setShowExplainability] = useState(false);

    const { result, teacherData, studentAnswer } = location.state || {};

    if (!result) {
        return (
            <div className="min-h-screen bg-light-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-text-primary mb-4">No Results Found</h1>
                    <button
                        onClick={() => navigate('/evaluate')}
                        className="bg-academic-blue hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Back to Evaluation
                    </button>
                </div>
            </div>
        );
    }

    const percentageScore = (result.finalScore / result.maxMarks) * 100;

    const getStatusColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (percentage) => {
        if (percentage >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
        if (percentage >= 60) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    };

    const getConceptIcon = (status) => {
        switch (status) {
            case 'covered':
                return (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'partial':
                return (
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'missing':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const statusBadge = getStatusBadge(percentageScore);

    return (
        <div className="min-h-screen bg-light-bg">
            {/* Header */}
            <header className="bg-white border-b border-border-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/evaluate')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-text-primary">Evaluation Results</h1>
                        </div>
                        <div className="text-sm text-text-secondary">
                            DeSeva - Automated Evaluation System
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Score Overview */}
                <div className="bg-white p-8 rounded-xl card-shadow mb-8">
                    <div className="text-center">
                        <div className="mb-6">
                            <div className={`text-6xl font-bold ${getStatusColor(percentageScore)}`}>
                                {result.finalScore}/{result.maxMarks}
                            </div>
                            <div className="text-2xl text-text-primary mt-2">
                                {percentageScore.toFixed(1)}%
                            </div>
                            <div className="mt-3">
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                                    {statusBadge.text}
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-academic-blue mb-2">
                                    {result.semanticSimilarity}%
                                </div>
                                <div className="text-sm text-text-secondary">Semantic Similarity</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                    <div
                                        className="bg-academic-blue h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${result.semanticSimilarity}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-academic-green mb-2">
                                    {result.conceptCoverage}%
                                </div>
                                <div className="text-sm text-text-secondary">Concept Coverage</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                    <div
                                        className="bg-academic-green h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${result.conceptCoverage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Feedback Section */}
                <div className="bg-white p-6 rounded-xl card-shadow mb-8">
                    <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
                        <svg className="w-6 h-6 text-academic-blue mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI-Generated Feedback
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Strengths
                            </h3>
                            <ul className="space-y-2">
                                {result.feedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-sm text-green-700 flex items-start">
                                        <span className="text-green-500 mr-2 mt-1">•</span>
                                        {strength}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Areas for Improvement
                            </h3>
                            <ul className="space-y-2">
                                {result.feedback.weaknesses.map((weakness, index) => (
                                    <li key={index} className="text-sm text-yellow-700 flex items-start">
                                        <span className="text-yellow-500 mr-2 mt-1">•</span>
                                        {weakness}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Suggestions
                            </h3>
                            <ul className="space-y-2">
                                {result.feedback.suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-sm text-blue-700 flex items-start">
                                        <span className="text-blue-500 mr-2 mt-1">•</span>
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Explainability Panel */}
                <div className="bg-white p-6 rounded-xl card-shadow mb-8">
                    <button
                        onClick={() => setShowExplainability(!showExplainability)}
                        className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                        <h2 className="text-xl font-semibold text-text-primary flex items-center">
                            <svg className="w-6 h-6 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Concept Analysis
                        </h2>
                        <svg
                            className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${showExplainability ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showExplainability && (
                        <div className="mt-6 space-y-3">
                            <div className="text-sm text-text-secondary mb-4">
                                Detailed breakdown of concept coverage in the answer:
                            </div>

                            {result.conceptAnalysis.map((concept, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getConceptIcon(concept.status)}
                                        <span className="font-medium text-text-primary">{concept.concept}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-text-secondary">Coverage:</span>
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${concept.status === 'covered' ? 'bg-green-500' :
                                                            concept.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${concept.coverage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-text-primary">{concept.coverage}%</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${concept.status === 'covered' ? 'bg-green-100 text-green-800' :
                                                concept.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {concept.status === 'covered' ? 'Covered' :
                                                concept.status === 'partial' ? 'Partially Covered' : 'Missing'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/evaluate')}
                        className="bg-academic-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Evaluate Another Answer
                    </button>

                    <button
                        onClick={() => {
                            // Print functionality or download report
                            window.print();
                        }}
                        className="bg-white border border-border-light text-text-primary font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Download Report
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ResultsPage;
