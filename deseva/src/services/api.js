import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
    (config) => {
        // You can add authentication headers here if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common error scenarios
        if (error.response) {
            // Server responded with error status
            switch (error.response.status) {
                case 400:
                    error.message = 'Invalid request data';
                    break;
                case 401:
                    error.message = 'Unauthorized access';
                    break;
                case 403:
                    error.message = 'Access forbidden';
                    break;
                case 404:
                    error.message = 'Service not found';
                    break;
                case 500:
                    error.message = 'Server error. Please try again later.';
                    break;
                default:
                    error.message = error.response.data?.message || 'An error occurred';
            }
        } else if (error.request) {
            // Request was made but no response received
            error.message = 'Network error. Please check your connection.';
        } else {
            // Something else happened
            error.message = error.message || 'An unexpected error occurred';
        }

        return Promise.reject(error);
    }
);

// API service functions
export const evaluationAPI = {
    // Evaluate a descriptive answer
    evaluateAnswer: async (data) => {
        const config = {
            headers: {
                'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
            },
        };
        const response = await api.post('/evaluate', data, config);
        return response.data;
    },

    // Process teacher file for model training
    processTeacherFile: async (formData) => {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };
        const response = await api.post('/process-teacher-file', formData, config);
        return response.data;
    },

    // Get evaluation history (if implemented)
    getEvaluationHistory: async (params = {}) => {
        const response = await api.get('/evaluations', { params });
        return response.data;
    },

    // Get specific evaluation result
    getEvaluationResult: async (evaluationId) => {
        const response = await api.get(`/evaluations/${evaluationId}`);
        return response.data;
    },

    // Submit feedback on evaluation (if implemented)
    submitFeedback: async (evaluationId, feedback) => {
        const response = await api.post(`/evaluations/${evaluationId}/feedback`, feedback);
        return response.data;
    },

    // Evaluate full question paper
    evaluateFullPaper: async (data) => {
        const response = await api.post('/evaluate/full-paper', data);
        return response.data;
    },
};

// Health check function
export const healthCheck = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        throw new Error('API service is unavailable');
    }
};

export default api;
