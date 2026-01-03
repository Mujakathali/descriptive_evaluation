import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartEvaluation = () => {
        navigate('/evaluate');
    };

    return (
        <div className="min-h-screen bg-light-bg">
            {/* Header */}
            <header className="bg-white border-b border-border-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-academic-blue rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">DeSeva</h1>
                        </div>
                        <div className="text-sm text-text-secondary">
                            Final Year Project – AI & NLP
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                        Automated Descriptive Answer Evaluation System
                    </h1>
                    <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
                        AI-powered system for meaning-based evaluation of descriptive answers with instant feedback.
                    </p>
                    <button
                        onClick={handleStartEvaluation}
                        className="bg-academic-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        Start Evaluation
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white p-6 rounded-xl card-shadow hover:card-shadow-hover transition-shadow duration-200">
                        <div className="w-12 h-12 bg-academic-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-academic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Semantic Evaluation</h3>
                        <p className="text-text-secondary">
                            Advanced NLP techniques analyze the meaning and context of answers, not just keyword matching.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl card-shadow hover:card-shadow-hover transition-shadow duration-200">
                        <div className="w-12 h-12 bg-academic-green bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-academic-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">AI-Generated Feedback</h3>
                        <p className="text-text-secondary">
                            Detailed, constructive feedback highlighting strengths and areas for improvement.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl card-shadow hover:card-shadow-hover transition-shadow duration-200">
                        <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Fair & Unbiased</h3>
                        <p className="text-text-secondary">
                            Consistent evaluation standards free from human bias and fatigue.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="bg-white p-8 rounded-xl card-shadow">
                    <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-academic-blue rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                                1
                            </div>
                            <h4 className="font-semibold text-text-primary mb-2">Enter Question</h4>
                            <p className="text-sm text-text-secondary">Provide the question and model answer</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-academic-blue rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                                2
                            </div>
                            <h4 className="font-semibold text-text-primary mb-2">Submit Answer</h4>
                            <p className="text-sm text-text-secondary">Student inputs their descriptive answer</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-academic-blue rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                                3
                            </div>
                            <h4 className="font-semibold text-text-primary mb-2">AI Evaluation</h4>
                            <p className="text-sm text-text-secondary">System analyzes semantic similarity and concepts</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-academic-blue rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                                4
                            </div>
                            <h4 className="font-semibold text-text-primary mb-2">Get Results</h4>
                            <p className="text-sm text-text-secondary">Receive marks and detailed feedback instantly</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-border-light mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-text-primary mb-2">DeSeva</h3>
                        <p className="text-text-secondary mb-4">
                            Final Year Project – AI & NLP
                        </p>
                        <div className="flex justify-center space-x-6 text-sm text-text-secondary">
                            <span>Built with React</span>
                            <span>•</span>
                            <span>Powered by NLP</span>
                            <span>•</span>
                            <span>Enhanced with LLMs</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
