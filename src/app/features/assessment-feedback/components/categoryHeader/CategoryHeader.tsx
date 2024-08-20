import React from 'react';

interface CategoryHeaderProps {
  categories: string[];
  currentCategory: string;
  onCategoryChange: (newCategory: string) => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ categories, currentCategory, onCategoryChange }) => {
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
    </div>
  );
};

export default CategoryHeader;
