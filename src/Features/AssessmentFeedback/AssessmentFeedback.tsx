import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './AssessmentFeedback.css'

interface Question {
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

  // Fetch questions based on the selected category
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/feedback/feedbacks/category/${category}`);
        const data = response.data;

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

  // Handle category change and navigation
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    navigate(`?category=${newCategory}`);
  };

  // Handle option (checkbox) changes
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

  // Handle comment input changes
  const handleCommentChange = (questionId: number, comment: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, comments: comment } : question
      )
    );
  };

  // Calculate rating based on selected options
  const calculateRating = (selectedOptions: boolean[]) => {
    const selectedCount = selectedOptions.filter((selected) => selected).length;
    if (selectedCount === 0) return 'Poor';
    if (selectedCount === 1) return 'Fair';
    if (selectedCount === 2) return 'Good';
    if (selectedCount === 3) return 'Very Good';
    if (selectedCount >= 4) return 'Excellent';
    return 'Poor';
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/feedback/feedbacks/submit', { questions });
      alert('Feedback submitted successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  return (
    <div>
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
        <div key={question.id} className="question-section">
          <h3>{question.text}</h3>
          {question.options.map((option, index) => (
            <div key={index}>
              <input
                type="checkbox"
                checked={question.selectedOptions[index]}
                onChange={() => handleOptionChange(question.id, index)}
              />
              <label>{option}</label>
            </div>
          ))}
          <div>
            <label>Your Comments</label>
            <input
              type="text"
              value={question.comments}
              onChange={(e) => handleCommentChange(question.id, e.target.value)}
            />
          </div>
          <div className="rating-section">
            {question.rating.map((rate, index) => (
              <label key={index}>
                <input
                  type="radio"
                  name={`rating-${question.id}`}
                  value={rate}
                  checked={rate === question.currentRating}
                  readOnly
                />
                {rate}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Feedback</button>
    </div>
  );
};

export default AssessmentFeedback;
