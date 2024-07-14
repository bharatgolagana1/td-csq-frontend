import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFeedbackByCategory, submitFeedback } from '../../api/AssessmentFeedbackAPI';
import { calculateRating } from '../calculate-rating/CalculateRating';
import QuestionSection from '../question-section/QuestionSection';
import './AssessmentFeedback.css';

export interface Question {
  id: number;
  text: string;
  options: string[];
  selectedOptions: boolean[];
  comments: string;
  rating: string[];
  currentRating: string;
}

const categories = ['Process', 'Technology', 'Facilities', 'Regulators', 'General Airport Infrastructure', 'Others'];

const AssessmentFeedback: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(new URLSearchParams(location.search).get('category') || 'Process');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getFeedbackByCategory(category);
        const formattedQuestions = data.map((item: any) => ({
          id: item._id,
          text: item.parameter,
          options: item.subParameters ? item.subParameters.map((sub: any) => sub.name) : [],
          selectedOptions: item.subParameters ? item.subParameters.map(() => false) : [],
          comments: '',
          rating: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
          currentRating: 'NA',
        }));
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, [category]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    navigate(`?category=${newCategory}`);
  };

  const handleOptionChange = (questionId: number, optionIndex: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              selectedOptions: question.selectedOptions.map((selected, index) =>
                index === optionIndex ? !selected : selected
              ),
              currentRating: calculateRating(
                question.selectedOptions.map((selected, index) =>
                  index === optionIndex ? !selected : selected
                )
              ),
            }
          : question
      )
    );
  };

  const handleCommentChange = (questionId: number, comment: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, comments: comment } : question
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const response = await submitFeedback(questions);
      alert('Feedback submitted successfully!');
      console.log(response);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  return (
    <div className='feedback'>
      <div className="category-header">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-button ${cat === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {questions.map((question) => (
        <QuestionSection
          key={question.id}
          question={question}
          handleOptionChange={handleOptionChange}
          handleCommentChange={handleCommentChange}
        />
      ))}
      <button onClick={handleSubmit}>Submit Feedback</button>
    </div>
  );
};

export default AssessmentFeedback;
