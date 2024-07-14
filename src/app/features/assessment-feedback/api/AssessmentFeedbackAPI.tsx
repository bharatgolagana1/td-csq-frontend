import axios from 'axios';

const API_URL = 'http://localhost:5000/feedback/feedbacks';

export const getFeedbackByCategory = async (category: string) => {
  try {
    const response = await axios.get(`${API_URL}/category/${category}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const submitFeedback = async (questions: any) => {
  try {
    const response = await axios.post(`${API_URL}/submit`, { questions });
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
