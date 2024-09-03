import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CategoryHeader from '../categoryHeader/CategoryHeader';
import QuestionSection, { Question, SubParameter } from '../questionSection/QuestionSection';
import { fetchQuestionsByCategory, saveSubparameters, finalSubmit } from '../../api/AssessmentAPI';
import './AssessmentForm.css';

const categories = ['Process', 'Technology', 'Facilities', 'Regulators', 'General Airport Infrastructure', 'Others'];

const FeedbackForm: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<{ [key: string]: Question[] }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(new URLSearchParams(location.search).get('category') || 'Process');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string>('');

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

  const calculateRating = (options: SubParameter[]) => {
    const totalOptions = options.length;
    const selectedCount = options.filter((option) => option.selected).length;
    
    if (totalOptions === 0) return 'Poor'; 
  
    const selectionRatio = selectedCount / totalOptions;
  
    if (selectionRatio === 0) return 'Poor';
    if (selectionRatio <= 0.25) return 'Fair';
    if (selectionRatio <= 0.5) return 'Good';
    if (selectionRatio <= 0.75) return 'Very Good';
    if (selectionRatio > 0.80) return 'Excellent';
  
    return 'NA';
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

  const handleRatingChange = (questionId: string, newRating: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, currentRating: newRating } : question
      )
    );
  };

  // Calculate the total number of questions across all parameters
  const totalQuestions = Object.values(allQuestions).flat().length;

  
  // Calculate the number of answered questions
const answeredQuestions = questions.filter(question => 
    (question.comment || '').trim() !== '' || question.options.some(option => option.selected)
  ).length;
  

  return (
    <div>
      <CategoryHeader 
        categories={categories} 
        currentCategory={category} 
        onCategoryChange={handleCategoryChange} 
        totalQuestions={totalQuestions} // Pass total number of questions
        answeredQuestions={answeredQuestions} // Pass the number of answered questions
      />
      {questions.map((question) => (
        <QuestionSection
         key={question.id}
         question={question}
         onOptionChange={handleOptionChange}
         onCommentChange={handleCommentChange}
         onRatingChange={handleRatingChange}
         allowRowClick
        />
      ))}
      {autoSaveMessage && <div className="auto-save-message">{autoSaveMessage}</div>}
      <div className='feedback-buttons'>
        <button onClick={handlePreviousCategory} className='prev-button' disabled={category === categories[0]}>Previous</button>
        <button onClick={handleNextCategory} className='next-button' disabled={category === categories[categories.length - 1]}>Next</button>
        <button onClick={handleFinalSubmit} className='final-submit-button'>Submit as Final</button>
      </div>
    </div>
  );
};

export default FeedbackForm;
