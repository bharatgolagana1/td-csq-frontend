import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CategoryHeader from '../categoryHeader/CategoryHeader';
import QuestionSection, { Question, SubParameter } from '../questionSection/QuestionSection';
import { fetchQuestionsByCategory, saveSubparameters, finalSubmit } from '../../api/AssessmentAPI';
import axios from 'axios';
import './AssessmentForm.css';

const FeedbackForm: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<{ [key: string]: Question[] }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(new URLSearchParams(location.search).get('category') || 'Process');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/feedback/feedback/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

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
      prevQuestions.map((question) => {
        if (question.id === questionId) {
          const updatedOptions = question.options.map((option) =>
            option.subId === subId ? { ...option, selected: !option.selected } : option
          );
          const currentRating = calculateRating(updatedOptions);
          const ratingValue = calculateRatingValue(updatedOptions);
          return {
            ...question,
            options: updatedOptions,
            currentRating,
            ratingValue,
            finalRating: calculateFinalRating(questions), // Update finalRating
          };
        }
        return question;
      })
    );
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, comments: comment } : question
      )
    );
  };

  const calculateRating = (options: SubParameter[]): string => {
    const x = options.filter((option) => option.selected).length;
    const y = options.length;
    if (y === 0 || x === 0) return 'NA';
    const z = (x / y) * 100;
    if (z >= 80) return 'Excellent';
    else if (z >= 60) return 'Very Good';
    else if (z >= 40) return 'Good';
    else if (z >= 20) return 'Fair';
    else if (z > 0) return 'Poor';
    else return 'NA';
  };
  const calculateRatingValue = (options: SubParameter[]): number => {
    const x = options.filter((option) => option.selected).length;
    const y = options.length;
    if (y === 0 || x === 0) return 0;
    const z = (x / y) * 100;
    // Map the calculated percentage to the appropriate rating value
    if (z >= 80) return 5; // Excellent
    else if (z >= 60) return 4; // Very Good
    else if (z >= 40) return 3; // Good
    else if (z >= 20) return 2; // Fair
    else if (z > 0) return 1; // Poor
    else return 0; // NA or no selected options
  };
  const calculateFinalRating = (questions: Question[]): number => {
    // Extract all rating values from the questions
    const ratingValues = questions.map(question => question.ratingValue).filter(value => value > 0);
    if (ratingValues.length === 0) return 0; // Return 0 if no valid ratings
    // Calculate the average rating value
    return ratingValues.reduce((acc, val) => acc + val, 0) / ratingValues.length;
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
      // Save the current category's questions before submission
      setAllQuestions((prev) => {
        const updatedQuestions = { ...prev, [category]: questions };
        const allQuestionsArray = Object.values(updatedQuestions).flat();
        const finalRating = calculateFinalRating(allQuestionsArray);
        // Update the final rating for each question
        const questionsWithFinalRating = allQuestionsArray.map((question) => ({
          ...question,
          finalRating,
        }));
        // Submit the feedback with the updated payload
        finalSubmit(questionsWithFinalRating)
          .then((response) => {
            alert('Feedback submitted successfully!');
            console.log(response);
          })
          .catch((error) => {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback. Please try again.');
          });
        return updatedQuestions; // Update state with the latest questions for all categories
      });
    } catch (error) {
      console.error('Error during final submission:', error);
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
