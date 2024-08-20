import React from 'react';
import './QuestionSection.css'
export interface SubParameter {
  subId: string;
  name: string;
  selected: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: SubParameter[];
  comments: string;
  rating: string[];
  currentRating: string;
}

interface QuestionSectionProps {
  question: Question;
  onOptionChange: (questionId: string, subId: string) => void;
  onCommentChange: (questionId: string, comment: string) => void;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ question, onOptionChange, onCommentChange }) => {
  return (
    <div key={question.id} className="question-section">
      <h3>{question.text}</h3>
      {question.options.map((option) => (
        <div key={option.subId} className="option-row" onClick={() => onOptionChange(question.id, option.subId)}>
          <input
            type="checkbox"
            checked={option.selected}
            onChange={() => onOptionChange(question.id, option.subId)}
          />
          <label>{option.name}</label>
        </div>
      ))}
      <div>
        <label>Your Comments</label>
        <input
          type="text"
          value={question.comments}
          onChange={(e) => onCommentChange(question.id, e.target.value)}
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
