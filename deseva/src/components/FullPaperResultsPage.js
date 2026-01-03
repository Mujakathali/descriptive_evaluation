import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const FullPaperResultsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());

    const { result, formData } = location.state || {};

    if (!result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">No Results Found</h1>
                    <button
                        onClick={() => navigate('/full-paper')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Back to Evaluation
                    </button>
                </div>
            </div>
        );
    }

    const { summary, question_wise_results } = result;
    const percentage = summary.overall_percentage;

    const getStatusColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'excellent': { text: 'Excellent', color: 'bg-green-100 text-green-800', icon: '✓' },
            'good': { text: 'Good', color: 'bg-blue-100 text-blue-800', icon: '✓' },
            'average': { text: 'Average', color: 'bg-yellow-100 text-yellow-800', icon: '⚠' },
            'poor': { text: 'Poor', color: 'bg-orange-100 text-orange-800', icon: '⚠' },
            'not_answered': { text: 'Not Answered', color: 'bg-red-100 text-red-800', icon: '✗' }
        };
        return badges[status] || badges['average'];
    };

    const toggleQuestion = (questionNo) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionNo)) {
            newExpanded.delete(questionNo);
        } else {
            newExpanded.add(questionNo);
        }
        setExpandedQuestions(newExpanded);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/full-paper')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Full Paper Evaluation Results
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-2xl mb-8">
                    <div className="text-center">
                        <div className="mb-6">
                            <div className={`text-6xl font-bold mb-2 ${getStatusColor(percentage)}`}>
                                {summary.marks_obtained}/{summary.total_marks}
                            </div>
                            <div className="text-3xl font-semibold mb-3">
                                {percentage}%
                            </div>
                            <div className="inline-flex px-4 py-2 bg-white bg-opacity-20 rounded-full text-lg font-medium">
                                {summary.overall_performance}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="text-2xl font-bold">{summary.total_questions}</div>
                                <div className="text-sm opacity-90">Total Questions</div>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="text-2xl font-bold">{summary.answered_questions}</div>
                                <div className="text-sm opacity-90">Answered</div>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="text-2xl font-bold">{summary.not_answered_questions}</div>
                                <div className="text-sm opacity-90">Not Answered</div>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="text-2xl font-bold">{summary.statistics.excellent + summary.statistics.good}</div>
                                <div className="text-sm opacity-90">Good+</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid md:grid-cols-5 gap-4 mb-8">
                    {Object.entries(summary.statistics).map(([key, value]) => {
                        const badge = getStatusBadge(key);
                        return (
                            <div key={key} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-center">
                                <div className="text-3xl font-bold mb-1" style={{ color: badge.color.split(' ')[1] }}>
                                    {value}
                                </div>
                                <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Question-wise Results */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Question-wise Detailed Results
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {question_wise_results.map((qResult) => {
                            const isExpanded = expandedQuestions.has(qResult.question_no);
                            const badge = getStatusBadge(qResult.label || qResult.status);
                            const qPercentage = (qResult.marks / qResult.max_marks) * 100;

                            return (
                                <div key={qResult.question_no} className="hover:bg-gray-50 transition-colors">
                                    <button
                                        onClick={() => toggleQuestion(qResult.question_no)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                {qResult.question_no}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800 mb-1">
                                                    Question {qResult.question_no}
                                                </div>
                                                <div className="text-sm text-gray-600 line-clamp-1">
                                                    {qResult.question}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {qResult.marks}/{qResult.max_marks}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {qPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                                {badge.text}
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-6 pb-6 pt-2 bg-gray-50">
                                            <div className="grid md:grid-cols-2 gap-6 mb-4">
                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="text-sm text-gray-600 mb-2">Semantic Similarity</div>
                                                    <div className="text-2xl font-bold text-blue-600 mb-2">
                                                        {qResult.semantic_similarity}%
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${qResult.semantic_similarity}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="text-sm text-gray-600 mb-2">Concept Coverage</div>
                                                    <div className="text-2xl font-bold text-green-600 mb-2">
                                                        {qResult.concept_coverage}%
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${qResult.concept_coverage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                                                <div className="text-sm font-semibold text-gray-700 mb-3">Question:</div>
                                                <div className="text-gray-800 mb-4">{qResult.question}</div>
                                            </div>

                                            {qResult.feedback && (
                                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                                    {qResult.feedback.strengths && qResult.feedback.strengths.length > 0 && (
                                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Strengths
                                                            </h4>
                                                            <ul className="space-y-1">
                                                                {qResult.feedback.strengths.map((s, i) => (
                                                                    <li key={i} className="text-sm text-green-700">• {s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {qResult.feedback.weaknesses && qResult.feedback.weaknesses.length > 0 && (
                                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                Weaknesses
                                                            </h4>
                                                            <ul className="space-y-1">
                                                                {qResult.feedback.weaknesses.map((w, i) => (
                                                                    <li key={i} className="text-sm text-yellow-700">• {w}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {qResult.feedback.suggestions && qResult.feedback.suggestions.length > 0 && (
                                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Suggestions
                                                            </h4>
                                                            <ul className="space-y-1">
                                                                {qResult.feedback.suggestions.map((s, i) => (
                                                                    <li key={i} className="text-sm text-blue-700">• {s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {qResult.covered_concepts && qResult.covered_concepts.length > 0 && (
                                                <div className="mb-2">
                                                    <div className="text-sm font-semibold text-gray-700 mb-2">Covered Concepts:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {qResult.covered_concepts.map((concept, i) => (
                                                            <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                {concept}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {qResult.missing_concepts && qResult.missing_concepts.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-700 mb-2">Missing Concepts:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {qResult.missing_concepts.map((concept, i) => (
                                                            <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                                {concept}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button
                        onClick={() => navigate('/full-paper')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
                    >
                        Evaluate Another Paper
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Download Report
                    </button>
                </div>
            </main>
        </div>
    );
};

export default FullPaperResultsPage;

