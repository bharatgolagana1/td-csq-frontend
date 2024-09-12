import axios from 'axios';
import { useUserInfo } from '../../../context/UserInfoContext';

const API_URL = 'http://localhost:5000';

export const fetchQuestionsByCategory = async (category: string) => {
  try {
    const response = await axios.get(`${API_URL}/feedback/feedbacks/categorys/${category}`);
    const data = response.data;
    return data.map((item: any) => ({
      id: item.feedbackId,
      text: item.parameter,
      options: item.subParameters
        ? item.subParameters.map((sub: any) => ({ subId: sub._id, name: sub.name, selected: false }))
        : [],
      comments: '',
      rating: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      currentRating: 'NA',
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const saveSubparameters = async (questions: any) => {
  try {
    const payload = questions.map((question: any) => ({
      userId : question.userId,
      feedbackId: question.id,
      subParameters: question.options.map((option: any) => ({
        subId: option.subId,
        name: option.name,
        selected: option.selected,
      })),
      comments: question.comments,
    }));
    await axios.post(`${API_URL}/assessmentfeedback/submit`, { feedbackResponses: payload });
    return 'Your current assessment is auto-saved.';
  } catch (error) {
    console.error('Error auto-saving subparameters:', error);
    throw error;
  }
};

export const calculateFinalRating = (questions: any[]): number => {
  const ratingValues = questions.map((question) => question.ratingValue).filter((value) => value > 0);
  if (ratingValues.length === 0) return 0;
  return ratingValues.reduce((acc, val) => acc + val, 0) / ratingValues.length;
};
// Final submit function
export const finalSubmit = async (questions: any) => {
  const { userInfo } = useUserInfo();
  
  if (!userInfo || !userInfo.userId || !userInfo.selectedOrganization) {
    console.error('User information is missing or incomplete:', userInfo);
    throw new Error('User information is missing or incomplete.');
  }

  try {
    const userId = userInfo.userId;
    const organizationId = userInfo.selectedOrganization;
    const userName = userInfo.userName || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`;
    const finalRating = calculateFinalRating(questions);

    const payload = {
      userId,
      userName,
      organizationId,
      finalRating,
      feedbacks: questions.map((question: any) => ({
        feedbackId: question.id,
        subParameters: question.options.map((option: any) => ({
          subId: option.subId,
          name: option.name,
          selected: option.selected,
        })),
        comments: question.comments || '',
        rating: question.currentRating || 'NA',
        ratingValue: question.ratingValue || 0,
      })),
    };

    console.log('Payload for final submit:', payload);
    const response = await axios.post(`${API_URL}/assessmentfeedback/submit`, payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

