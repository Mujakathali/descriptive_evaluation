import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import EvaluationPage from './components/EvaluationPage';
import LandingPage from './components/LandingPage';
import ResultsPage from './components/ResultsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/evaluate" element={<EvaluationPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
