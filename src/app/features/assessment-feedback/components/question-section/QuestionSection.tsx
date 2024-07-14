import React from 'react';
import { Question } from '../AssessmentFeedback/AssessmentFeedback';

interface QuestionSectionProps {
  question: Question;
  handleOptionChange: (questionId: number, optionIndex: number) => void;
  handleCommentChange: (questionId: number, comment: string) => void;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ question, handleOptionChange, handleCommentChange }) => {
  return (
    <div className="question-section">
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
  );
};

export default QuestionSection;
