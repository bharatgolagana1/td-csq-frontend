import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CategoryHeader from '../categoryHeader/CategoryHeader';
import QuestionSection from '../question-section/QuestionSection';
import { fetchQuestionsByCategory, saveSubparameters, finalSubmit } from '../../api/AssessmentFeedbackAPI';
import './AssessmentForm.css';

const categories = ['Process', 'Technology', 'Facilities', 'Regulators', 'General Airport Infrastructure', 'Others'];

interface SubParameter {
  subId: string;
  name: string;
  selected: boolean;
}

interface Question {
  id: string;
  text: string;
  options: SubParameter[];
  comments: string;
  rating: string[];
  currentRating: string;
}

const FeedbackForm: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<{ [key: string]: Question[] }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(new URLSearchParams(location.search).get('category') || 'Process');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string>('');
  const [isSubmitEnabled, setIsSubmitEnabled] = useState<boolean>(false);
  const [isFinalSubmitEnabled, setIsFinalSubmitEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await fetchQuestionsByCategory(category);
        setQuestions(data);
        setAllQuestions(prev => ({ ...prev, [category]: data }));
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    if (allQuestions[category]) {
      setQuestions(allQuestions[category]);
    } else {
      fetchQuestions();
    }
  }, [category, allQuestions]);

  const handleCategoryChange = (newCategory: string) => {
    setAllQuestions(prev => ({ ...prev, [category]: questions }));
    setCategory(newCategory);
    navigate(`?category=${newCategory}`);
  };

  const handleOptionChange = (questionId: string, subId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.subId === subId ? { ...option, selected: !option.selected } : option
              ),
              currentRating: calculateRating(
                question.options.map((option) =>
                  option.subId === subId ? { ...option, selected: !option.selected } : option
                )
              ),
            }
          : question
      )
    );
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, comments: comment } : question
      )
    );
  };

  const calculateRating = (selectedOptions: SubParameter[]) => {
    const selectedCount = selectedOptions.filter((option) => option.selected).length;
    if (selectedCount === 0) return 'Poor';
    if (selectedCount === 1) return 'Fair';
    if (selectedCount === 2) return 'Good';
    if (selectedCount === 3) return 'Very Good';
    if (selectedCount >= 4) return 'Excellent';
    return 'Poor';
  };

  useEffect(() => {
    const autoSave = async () => {
      try {
        const message = await saveSubparameters(questions);
        setAutoSaveMessage(message);
        setTimeout(() => setAutoSaveMessage(''), 5000);
      } catch (error) {
        console.error('Error auto-saving subparameters:', error);
      }
    };

    const timer = setTimeout(() => {
      autoSave();
      localStorage.setItem('autoSaveData', JSON.stringify({ questions, timestamp: Date.now() }));
    }, 60000);
    return () => clearTimeout(timer);
  }, [questions]);

  useEffect(() => {
    const allQuestionsAttempted = questions.every(question => question.options.some(option => option.selected));
    setIsSubmitEnabled(allQuestionsAttempted);

    const allCategoriesAttempted = categories.every(category => {
      const categoryQuestions = allQuestions[category];
      return categoryQuestions ? categoryQuestions.every(question => question.options.some(option => option.selected)) : true;
    });
    setIsFinalSubmitEnabled(allCategoriesAttempted);
  }, [questions, allQuestions]);

  useEffect(() => {
    const autoSaveData = localStorage.getItem('autoSaveData');
    if (autoSaveData) {
      const { questions: savedQuestions, timestamp } = JSON.parse(autoSaveData);
      if (Date.now() - timestamp < 3600000) {
        setQuestions(savedQuestions);
      } else {
        localStorage.removeItem('autoSaveData');
      }
    }
  }, []);

  const handleFinalSubmit = async () => {
    try {
      const response = await finalSubmit(allQuestions);
      alert('Feedback submitted successfully!');
      console.log(response);
      localStorage.removeItem('autoSaveData');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  const handleNextCategory = () => {
    const currentIndex = categories.indexOf(category);
    if (currentIndex < categories.length - 1) {
      handleCategoryChange(categories[currentIndex + 1]);
    }
  };

  const handlePreviousCategory = () => {
    const currentIndex = categories.indexOf(category);
    if (currentIndex > 0) {
      handleCategoryChange(categories[currentIndex - 1]);
    }
  };

  return (
    <div>
      <CategoryHeader categories={categories} currentCategory={category} onCategoryChange={handleCategoryChange} />
      {questions.map((question) => (
        <QuestionSection key={question.id} question={question} onOptionChange={handleOptionChange} onCommentChange={handleCommentChange} />
      ))}
      {autoSaveMessage && <div className="auto-save-message">{autoSaveMessage}</div>}
      <div className='feedback-buttons'>
        <button onClick={handlePreviousCategory} className='prev-button' disabled={category === categories[0]}>Previous</button>
        <button onClick={handleNextCategory} className='next-button' disabled={category === categories[categories.length - 1]}>Next</button>
        <button onClick={handleFinalSubmit} className='final-submit-button' disabled={!isFinalSubmitEnabled}>Submit as Final</button>
        <button onClick={handleNextCategory} className='save-button' disabled={!isSubmitEnabled}>Submit Feedback</button>
      </div>
    </div>
  );
};

export default FeedbackForm;
