# DeSeva - Automated Descriptive Answer Evaluation System

🎯 **AI-powered system for meaning-based evaluation of descriptive answers with instant feedback.**

## Overview

DeSeva is a modern web application that leverages AI and Natural Language Processing to automatically evaluate descriptive answers, providing fair and unbiased marking with detailed feedback similar to human examiners.

## Features

- **🧠 Semantic Evaluation**: Advanced NLP techniques analyze meaning and context, not just keywords
- **📝 AI-Generated Feedback**: Detailed constructive feedback highlighting strengths and improvement areas
- **⚖️ Fair & Unbiased**: Consistent evaluation standards free from human bias
- **📊 Detailed Analytics**: Concept coverage analysis with visual progress indicators
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 19, TailwindCSS, React Router
- **Backend Integration**: RESTful API with Axios
- **UI/UX**: Modern, clean academic design with card-based layouts
- **Styling**: TailwindCSS with custom academic color scheme

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deseva
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API configuration
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/
│   ├── LandingPage.js      # Main landing page
│   ├── EvaluationPage.js   # Teacher/student input forms
│   └── ResultsPage.js      # Results display with feedback
├── services/
│   └── api.js             # API integration layer
├── App.js                 # Main application with routing
├── index.css              # Global styles and TailwindCSS
└── index.js               # Application entry point
```

## API Integration

The frontend expects a RESTful API endpoint at `/evaluate` with the following structure:

### POST /evaluate

**Request Body:**
```json
{
  "question": "string",
  "modelAnswer": "string", 
  "studentAnswer": "string",
  "maxMarks": "number",
  "weights": {
    "semantic": "number (0-1)",
    "concept": "number (0-1)"
  }
}
```

**Response Body:**
```json
{
  "finalScore": "number",
  "semanticSimilarity": "number (0-100)",
  "conceptCoverage": "number (0-100)",
  "maxMarks": "number",
  "feedback": {
    "strengths": ["string"],
    "weaknesses": ["string"], 
    "suggestions": ["string"]
  },
  "conceptAnalysis": [
    {
      "concept": "string",
      "status": "covered|partial|missing",
      "coverage": "number (0-100)"
    }
  ]
}
```

## User Flow

1. **Landing Page**: Introduction to the system with feature highlights
2. **Evaluation Page**: 
   - Teachers input questions and model answers
   - Students submit their answers (text or file upload)
   - Configure evaluation weightages
3. **Results Page**: 
   - Display scores and detailed feedback
   - Concept analysis with visual indicators
   - Downloadable reports

## Design Principles

- **Academic Focus**: Clean, professional design suitable for educational institutions
- **Accessibility**: Semantic HTML5, ARIA labels, keyboard navigation
- **Performance**: Optimized components and lazy loading
- **Mobile-First**: Responsive design that works on all devices

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of a Final Year Project in AI & NLP.

## Contact

For any queries or support, please contact the development team.

---

**Final Year Project – AI & NLP**  
Built with ❤️ using React, TailwindCSS, and modern web technologies.
"# descriptive_evaluation" 
"# descriptive_evaluation" 
