import React from 'react';
import './QuestionSection.css';

export interface SubParameter {
  subId: string;
  name: string;
  selected: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: SubParameter[];
  rating: string[];
  currentRating: string;
  comment: string;
}

interface QuestionSectionProps {
  question: Question;
  onOptionChange: (questionId: string, subId: string) => void;
  onCommentChange: (questionId: string, comment: string) => void;
  onRatingChange: (questionId: string, newRating: string) => void;
  allowRowClick?: boolean;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({
  question,
  onOptionChange,
  onCommentChange,
  onRatingChange,
  allowRowClick = false,
}) => {

  // Handle changes to the rating
  const handleRatingChange = (rating: string) => {
    onRatingChange(question.id, rating);
  };

  // Handle row click to select the option
  const handleRowClick = (subId: string) => {
    if (allowRowClick) {
      onOptionChange(question.id, subId);
    }
  };

  return (
    <div key={question.id} className="question-section">
      <h3>{question.text}</h3>
      {question.options.map((option) => (
        <div 
          key={option.subId} 
          className={`option-row ${option.selected ? 'selected' : ''}`} 
          onClick={() => handleRowClick(option.subId)}
        >
          <input
            type="checkbox"
            checked={option.selected}
            onChange={(e) => {
              e.stopPropagation(); // Prevent row click handler from firing
              onOptionChange(question.id, option.subId);
            }}
          />
          <label>{option.name}</label>
        </div>
      ))}
      <div className="rating-section">
        {question.rating.map((rate, index) => (
          <label key={index}>
            <input
              type="radio"
              name={`rating-${question.id}`}
              value={rate}
              checked={rate === question.currentRating}
              onChange={(e) => {
                e.stopPropagation(); // Prevent row click handler from firing
                handleRatingChange(rate); // Handle rating change
              }}
            />
            {rate}
          </label>
        ))}
      </div>
      <div className="comment-section">
        <input
          type="text"
          placeholder="Add your comment"
          value={question.comment}
          onChange={(e) => onCommentChange(question.id, e.target.value)}
        />
      </div>
    </div>
  );
};

export default QuestionSection;
