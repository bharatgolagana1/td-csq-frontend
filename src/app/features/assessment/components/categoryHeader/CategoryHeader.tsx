import React from 'react';

interface CategoryHeaderProps {
  categories: string[];
  currentCategory: string;
  onCategoryChange: (newCategory: string) => void;
  totalQuestions: number;
  answeredQuestions: number;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ categories, currentCategory, onCategoryChange, totalQuestions, answeredQuestions }) => {
  return (
    <div className="category-header">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-button ${cat === currentCategory ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat)}
        >
          {cat}
        </button>
      ))}
      <div className="progress">
        <span>{answeredQuestions} / {totalQuestions} questions answered</span>
      </div>
    </div>
  );
};

export default CategoryHeader;
