import axios from 'axios';

export const fetchQuestionsByCategory = async (category: string) => {
  try {
    const response = await axios.get(`http://localhost:5000/feedback/feedbacks/category/${category}`);
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
      feedbackId: question.id,
      subParameters: question.options.map((option: any) => ({
        subId: option.subId,
        name: option.name,
        selected: option.selected,
      })),
      comments: question.comments,
    }));
    await axios.post('http://localhost:5000/user/submit', { feedbackResponses: payload });
    return 'Your current assessment is auto-saved.';
  } catch (error) {
    console.error('Error auto-saving subparameters:', error);
    throw error;
  }
};

export const finalSubmit = async (allQuestions: any) => {
  try {
    const payload = Object.values(allQuestions)
      .flat()
      .map((question: any) => ({
        feedbackId: question.id,
        subParameters: question.options.map((option: any) => ({
          subId: option.subId,
          name: option.name,
          selected: option.selected,
        })),
        comments: question.comments,
      }));
    const response = await axios.post('http://localhost:5000/user/submit', { feedbackResponses: payload });
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
