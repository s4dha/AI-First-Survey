
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SURVEY_DATA, GOOGLE_SCRIPT_URL } from './constants';
import { QuestionType, FormData, Question, Option, SurveySection } from './types';
import Dashboard from './Dashboard';

// Helper component for Icons
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
    <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
  </svg>
);

// Safe LocalStorage wrapper to handle errors
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage:`, e);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Error removing ${key} from localStorage:`, e);
    }
  }
};

// Prepare the payload for Google Sheets (human-readable)
const prepareSheetPayload = (formData: FormData, surveyData: SurveySection[]) => {
    const payload: any = {};
    
    // Add submitted timestamp explicitly (though sheet script also does it)
    payload['Submitted At'] = new Date().toLocaleString();

    surveyData.forEach(section => {
        section.questions.forEach(q => {
            const value = formData[q.id];
            
            // Helper to find label from options
            const findLabel = (val: string, opts: Option[]) => {
                const opt = opts.find(o => o.value === val);
                return opt ? opt.label : val;
            }

            // Special handling for Matrix: flatten into separate columns
            if (q.type === QuestionType.LIKERT_MATRIX && q.rows) {
                 q.rows.forEach(row => {
                     const rowVal = value ? value[row.id] : '';
                     // Header format: "Q12a. ... [Monthly Sprints]"
                     payload[`${q.text} [${row.text}]`] = rowVal || "";
                 });
                 // Do not process matrix as a single column
                 return; 
            }

            let answerLabel = "";

            // Handle different question types to format the output string
            if (q.type === QuestionType.CHECKBOX || q.type === QuestionType.MULTI_SELECT_CHECKBOX || q.type === QuestionType.CHECKBOX_WITH_TEXT || q.type === QuestionType.GROUPED_CHECKBOX) {
                if (Array.isArray(value)) {
                    answerLabel = value.map(val => {
                        let text = findLabel(val, q.options || []);
                        // Check for specific text input associated with this option
                        const textInputKey = `${q.id}_${val}_text`;
                        if (formData[textInputKey]) {
                            text += ` (${formData[textInputKey]})`;
                        }
                        return text;
                    }).join(", ");
                }
            } else if (q.type === QuestionType.RADIO || q.type === QuestionType.DROPDOWN || q.type === QuestionType.CONDITIONAL_RADIO) {
                if (value !== undefined && value !== null && value !== "") {
                    answerLabel = findLabel(value as string, q.options || []);
                    
                    // Handle "Other" text input for dropdown/radio or specific hasTextInput fields
                    const selectedOpt = q.options?.find(o => o.value === value);
                    if ((value === 'other' || value === 'Other') || (selectedOpt?.hasTextInput)) {
                         // For radios with text input, we use the same naming convention as checkboxes: questionId_value_text
                         // For simple 'other', we check legacy convention questionId_other
                         const specificTextKey = `${q.id}_${value}_text`;
                         const otherKey = `${q.id}_other`;
                         
                         if (formData[specificTextKey]) {
                             answerLabel += ` (${formData[specificTextKey]})`;
                         } else if (formData[otherKey]) {
                             answerLabel += ` (${formData[otherKey]})`;
                         }
                    }
                }
            } else if (q.type === QuestionType.SLIDER_PAIR) {
                const before = formData[`${q.id}_before`];
                const now = formData[`${q.id}_now`];
                if (before !== undefined && now !== undefined) {
                    answerLabel = `Before: ${before}%, Now: ${now}%`;
                }
            } else {
                answerLabel = value !== undefined ? String(value) : "";
            }

            // Use the Question Text as the Header Key
            payload[q.text] = answerLabel;

            // CRITICAL: Handle Subquestion immediately after main question to ensure column adjacency
            if (q.subQuestion) {
                 // Always generate the column key so the sheet structure is stable
                 let subLabel = "";
                 
                 // Only populate if logic triggers
                 if (q.type === QuestionType.CONDITIONAL_RADIO && Array.isArray(q.subQuestion.triggerValues) && q.subQuestion.triggerValues.includes(String(value))) {
                     const subVal = formData[q.subQuestion.id];
                     if (subVal) {
                        subLabel = findLabel(subVal, q.subQuestion.options);
                     }
                 }
                 
                 payload[q.subQuestion.text] = subLabel;
            }
        });
    });
    return payload;
};


// This helper component is defined outside the main App component to prevent re-rendering issues.
const QuestionRenderer: React.FC<{
  question: Question;
  formData: FormData;
  handleInputChange: (id: string, value: any) => void;
  isInvalid: boolean;
}> = ({ question, formData, handleInputChange, isInvalid }) => {
  
  const renderInput = () => {
    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <input
            type="text"
            id={question.id}
            name={question.id}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`mt-2 block w-full rounded-md shadow-sm border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 ${isInvalid ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter your answer"
          />
        );

      case QuestionType.DROPDOWN:
        return (
          <>
            <select
              id={question.id}
              name={question.id}
              value={formData[question.id] || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`mt-2 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 ${isInvalid ? 'border-red-500' : 'border-gray-300'}`}
            >
              {question.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formData[question.id] === 'Other' && (
              <input
                type="text"
                placeholder="Please specify"
                onChange={(e) => handleInputChange(`${question.id}_other`, e.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            )}
          </>
        );

      case QuestionType.CHECKBOX:
      case QuestionType.CHECKBOX_WITH_TEXT:
      case QuestionType.MULTI_SELECT_CHECKBOX:
        const selectedValues = Array.isArray(formData[question.id]) ? formData[question.id] : [];
        const limit = question.limit || Infinity;

        const onCheckboxChange = (value: string) => {
          const newValues = [...selectedValues];
          const index = newValues.indexOf(value);
          if (index > -1) {
            newValues.splice(index, 1);
          } else {
             if (newValues.length < limit) {
                if (value === 'no_challenges' || value === 'did_not_participate' || value === 'no_barriers') {
                  handleInputChange(question.id, [value]);
                  return;
                }
                const exclusiveIndex = newValues.findIndex(v => ['no_challenges', 'did_not_participate', 'no_barriers'].includes(v));
                if (exclusiveIndex > -1) newValues.splice(exclusiveIndex, 1);
                
                newValues.push(value);
             }
          }
          handleInputChange(question.id, newValues);
        };
        
        return (
          <div className="mt-2 space-y-3">
            {question.type === QuestionType.MULTI_SELECT_CHECKBOX && <p className="text-sm text-gray-500">Selected {selectedValues.length} of {limit}.</p>}
            {question.options?.map((opt) => (
              <div key={opt.value}>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt.value)}
                    onChange={() => onCheckboxChange(opt.value)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{opt.label}</span>
                </label>
                {opt.hasTextInput && selectedValues.includes(opt.value) && (
                  <input
                    type="text"
                    placeholder={opt.textInputLabel || "Please specify"}
                    value={formData[`${question.id}_${opt.value}_text`] || ''}
                    onChange={(e) => handleInputChange(`${question.id}_${opt.value}_text`, e.target.value)}
                    className="mt-2 ml-0 sm:ml-7 block w-full sm:w-[calc(100%-2rem)] max-w-sm rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  />
                )}
              </div>
            ))}
          </div>
        );

      case QuestionType.GROUPED_CHECKBOX: {
        // Prepare groups in a standard loop to avoid reduce/type issues
        const groupedOptions: { [key: string]: Option[] } = {};
        const opts = question.options || [];
        for (let i = 0; i < opts.length; i++) {
            const opt = opts[i];
            const gName = opt.group || 'Other';
            if (!groupedOptions[gName]) {
                groupedOptions[gName] = [];
            }
            groupedOptions[gName].push(opt);
        }

        return (
          <div className="mt-2 space-y-3">
            {Object.keys(groupedOptions).map((groupName) => (
              <React.Fragment key={groupName}>
                <h4 className="font-semibold text-gray-800 pt-4 border-t border-gray-200 first:border-t-0 first:pt-0">
                  {groupName}
                </h4>
                {groupedOptions[groupName].map(opt => {
                  const selected = Array.isArray(formData[question.id]) ? formData[question.id] : [];
                  const isChecked = selected.includes(opt.value);
                  
                  const handleChange = () => {
                    const newValues = [...selected];
                    const index = newValues.indexOf(opt.value);
                    if (index > -1) {
                      newValues.splice(index, 1);
                    } else {
                      newValues.push(opt.value);
                    }
                    handleInputChange(question.id, newValues);
                  };

                  return (
                    <div key={opt.value}>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{opt.label}</span>
                      </label>
                      {opt.hasTextInput && isChecked && (
                        <input
                          type="text"
                          placeholder={opt.textInputLabel || "Please specify"}
                          value={formData[`${question.id}_${opt.value}_text`] || ''}
                          onChange={(e) => handleInputChange(`${question.id}_${opt.value}_text`, e.target.value)}
                          className="mt-2 ml-0 sm:ml-7 block w-full sm:w-[calc(100%-2rem)] max-w-sm rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        );
      }

      case QuestionType.RADIO:
      case QuestionType.CONDITIONAL_RADIO:
        const subQuestionIsVisible = question.subQuestion && Array.isArray(question.subQuestion.triggerValues) && question.subQuestion.triggerValues.includes(String(formData[question.id] || ''));
        const subQuestionIsInvalid = isInvalid && subQuestionIsVisible && !formData[question.subQuestion.id];

        // Ensure sub-question options are an array before mapping to prevent crashes
        const subOptions = (subQuestionIsVisible && question.subQuestion && Array.isArray(question.subQuestion.options)) 
            ? question.subQuestion.options 
            : [];

        return (
          <div className="mt-2 space-y-3">
            {question.options?.map((opt) => (
              <div key={opt.value}>
                <label className="flex items-center">
                    <input
                    type="radio"
                    name={question.id}
                    value={opt.value}
                    checked={formData[question.id] === opt.value}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{opt.label}</span>
                </label>
                {/* Render text input if selected and hasTextInput is true */}
                {opt.hasTextInput && formData[question.id] === opt.value && (
                    <input
                        type="text"
                        placeholder={opt.textInputLabel || "Please specify"}
                        value={formData[`${question.id}_${opt.value}_text`] || ''}
                        onChange={(e) => handleInputChange(`${question.id}_${opt.value}_text`, e.target.value)}
                        className="mt-2 ml-0 sm:ml-7 block w-full sm:w-[calc(100%-2rem)] max-w-sm rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    />
                )}
              </div>
            ))}
            {subQuestionIsVisible && question.subQuestion && (
              <div className="mt-4 pt-4 pl-6 border-l-2 border-indigo-200">
                <div id={`question-wrapper-${question.subQuestion.id}`} className={subQuestionIsInvalid ? 'ring-2 ring-red-400 rounded-lg p-4' : ''}>
                  <label className="text-base font-semibold text-gray-800">
                    {question.subQuestion.text}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2 space-y-3">
                    {subOptions.map(subOpt => (
                      <label key={subOpt.value} className="flex items-center">
                        <input
                          type="radio"
                          name={question.subQuestion.id}
                          value={subOpt.value}
                          checked={formData[question.subQuestion.id] === subOpt.value}
                          onChange={(e) => handleInputChange(question.subQuestion.id, e.target.value)}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{subOpt.label}</span>
                      </label>
                    ))}
                  </div>
                  {subQuestionIsInvalid && <p className="text-xs text-red-600 mt-2">This field is required.</p>}
                </div>
              </div>
            )}
          </div>
        );

      case QuestionType.LIKERT_MATRIX:
          const currentValues = formData[question.id] || {};
          return (
              <div className="mt-4 space-y-4">
                  {question.rows?.map((row) => (
                      <div key={row.id} className="py-3 border-b border-gray-100 last:border-0">
                          <p className="text-sm font-medium text-gray-700 mb-2">{row.text}</p>
                          <div className="flex flex-wrap gap-3">
                              {question.options?.map((opt) => (
                                  <label key={`${row.id}-${opt.value}`} className="flex items-center space-x-1 cursor-pointer">
                                      <input
                                          type="radio"
                                          name={`${question.id}-${row.id}`}
                                          value={opt.value}
                                          checked={currentValues[row.id] === opt.value}
                                          onChange={(e) => {
                                              const newVal = { ...currentValues, [row.id]: e.target.value };
                                              handleInputChange(question.id, newVal);
                                          }}
                                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="text-xs sm:text-sm text-gray-600">{opt.label}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          );

      case QuestionType.TEXTAREA:
        return (
          <textarea
            id={question.id}
            name={question.id}
            rows={4}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          ></textarea>
        );
      
      case QuestionType.SLIDER_PAIR:
        const beforeVal = formData[`${question.id}_before`] !== undefined ? formData[`${question.id}_before`] : 25;
        const nowVal = formData[`${question.id}_now`] !== undefined ? formData[`${question.id}_now`] : 10;
        return (
            <div className='mt-4 space-y-6'>
                <div>
                    <label htmlFor={`${question.id}_before`} className="block text-sm font-medium text-gray-700">Before AI-First: <span className='font-bold text-indigo-600'>{beforeVal}% of my time</span></label>
                    <input
                        id={`${question.id}_before`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={beforeVal}
                        onChange={(e) => handleInputChange(`${question.id}_before`, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <label htmlFor={`${question.id}_now`} className="block text-sm font-medium text-gray-700">NOW, after embracing AI tools and solutions: <span className='font-bold text-indigo-600'>{nowVal}% of my time</span></label>
                    <input
                        id={`${question.id}_now`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={nowVal}
                        onChange={(e) => handleInputChange(`${question.id}_now`, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div id={`question-wrapper-${question.id}`} className={`bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 ${isInvalid ? 'ring-2 ring-red-400' : ''}`}>
      <label className="text-base font-semibold text-gray-800">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && <p className="text-sm text-gray-500 mt-1">{question.description}</p>}
      {renderInput()}
      {isInvalid && question.type !== QuestionType.CONDITIONAL_RADIO && <p className="text-xs text-red-600 mt-2">This field is required.</p>}
    </div>
  );
};

const allQuestions = SURVEY_DATA.flatMap(section => section.questions);

const calculateProgress = (formData: FormData): number => {
    try {
        let totalRequired = 0;
        let answeredRequired = 0;

        for (const q of allQuestions) {
            if (!q.required) {
                continue;
            }

            totalRequired++;
            const value = formData[q.id];
            let isAnswered = false;
            
            if (q.type === QuestionType.SLIDER_PAIR) {
                if (formData[`${q.id}_before`] != null && formData[`${q.id}_now`] != null) {
                    isAnswered = true;
                }
            } else if (q.type === QuestionType.LIKERT_MATRIX) {
                // For Matrix, ALL rows must have a value to count as answered if required
                if (q.rows) {
                    const vals = value || {};
                    const allRowsAnswered = q.rows.every(row => vals[row.id] !== undefined && vals[row.id] !== '');
                    if (allRowsAnswered) isAnswered = true;
                }
            } else if (Array.isArray(value)) {
                if (value.length > 0) {
                    isAnswered = true;
                }
            } else {
                if (value != null && value !== '') {
                    isAnswered = true;
                }
            }

            if (isAnswered) {
                answeredRequired++;
            }

            if (q.type === QuestionType.CONDITIONAL_RADIO && q.subQuestion && Array.isArray(q.subQuestion.triggerValues)) {
                const mainValue = formData[q.id];
                if (q.subQuestion.triggerValues.includes(String(mainValue || ''))) {
                    totalRequired++;
                    const subValue = formData[q.subQuestion.id];
                    if (subValue != null && subValue !== '') {
                        answeredRequired++;
                    }
                }
            }
        }

        if (totalRequired === 0) {
            return 100;
        }

        return Math.round((answeredRequired / totalRequired) * 100);
    } catch (error) {
        console.error("Critical error in calculateProgress, returning 0 to prevent crash:", error);
        return 0;
    }
}

const getFreshFormData = (): FormData => {
    const initialData: FormData = {};
    
    allQuestions.forEach(question => {
        if (question.type === QuestionType.SLIDER_PAIR) {
            if (question.id === "q11_time_spent") {  
                initialData[`${question.id}_before`] = 65;
            }
        }
    });

    return initialData;
};


type ViewMode = 'survey' | 'dashboard';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('survey');
  const [formData, setFormData] = useState<FormData>(() => {
    const savedData = storage.get('surveyFormData');
    const initialData = getFreshFormData();

    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                return { ...initialData, ...parsedData };
            }
        } catch (e) {
            console.error("Failed to parse saved survey data from localStorage", e);
        }
    }
    return initialData;
  });
  
  const [invalidQuestionIds, setInvalidQuestionIds] = useState<Set<string>>(new Set());
  const [formComplete, setFormComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSectionTitle, setCurrentSectionTitle] = useState(SURVEY_DATA[0]?.title || '');
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
        storage.set('surveyFormData', JSON.stringify(formData));
    }
  }, [formData]);
  
  // Observer for current section
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-100px 0px -80% 0px", // Adjust margins for sticky header
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionIndex = sectionRefs.current.findIndex(ref => ref === entry.target);
          if (sectionIndex > -1) {
            setCurrentSectionTitle(SURVEY_DATA[sectionIndex].title);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const currentRefs = sectionRefs.current;
    currentRefs.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [viewMode]); // Re-run if view mode changes
  
  const handleInputChange = useCallback((id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    // Optimistically remove validation error on change
    setInvalidQuestionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const invalidIds = new Set<string>();
    allQuestions.forEach(q => {
      if (!q.required) return;
      
      let isInvalid = false;
      if (q.type === QuestionType.SLIDER_PAIR) {
        const beforeValue = formData[`${q.id}_before`];
        const nowValue = formData[`${q.id}_now`];
        if (beforeValue === undefined || beforeValue === null || nowValue === undefined || nowValue === null) {
          isInvalid = true;
        }
      } else if (q.type === QuestionType.LIKERT_MATRIX) {
        // Check if all rows are answered
        const val = formData[q.id] || {};
        if (q.rows) {
            const allAnswered = q.rows.every(row => val[row.id] !== undefined && val[row.id] !== '');
            if (!allAnswered) isInvalid = true;
        }
      } else {
        const value = formData[q.id];
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          isInvalid = true;
        }
      }
      if (isInvalid) {
          invalidIds.add(q.id);
      }
      
      if (q.type === QuestionType.CONDITIONAL_RADIO && q.subQuestion && Array.isArray(q.subQuestion.triggerValues) && q.subQuestion.triggerValues.includes(String(formData[q.id] || '')) && !formData[q.subQuestion.id]) {
        invalidIds.add(q.id);
        invalidIds.add(q.subQuestion.id);
      }
    });

    setInvalidQuestionIds(invalidIds);

    if (invalidIds.size === 0) {
      setIsSubmitting(true);
      console.log("Validating successful, preparing payload...");
      
      const payload = prepareSheetPayload(formData, SURVEY_DATA);
      
      // Log the payload for debugging
      console.log("Submitting payload to Google Sheets:", payload);

      try {
        // Send data to Google Apps Script
        // mode: 'no-cors' is required for Google Apps Script web apps invoked from browser
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain', // Important: text/plain prevents preflight check
            },
            body: JSON.stringify(payload)
        });
        
        console.log("Submitted to Google Sheet");
        storage.remove('surveyFormData');
        setFormComplete(true);

      } catch (error) {
          console.error("Error submitting form:", error);
          alert("There was a network error submitting the form. Please try again.");
      } finally {
          setIsSubmitting(false);
      }
      
    } else {
      console.log("Form has validation errors on questions:", [...invalidIds]);
      
      const firstInvalidId = Array.from(invalidIds)[0];
      const firstInvalidQuestion = allQuestions.find(q => q.id === firstInvalidId || (q.subQuestion && q.subQuestion.id === firstInvalidId));
      
      if (firstInvalidQuestion) {
          const element = document.getElementById(`question-wrapper-${firstInvalidQuestion.id}`);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
    }
  };

  const handleStartNewSurvey = () => {
      setFormData(getFreshFormData());
      setInvalidQuestionIds(new Set());
      setFormComplete(false);
      setCurrentSectionTitle(SURVEY_DATA[0]?.title || '');
      window.scrollTo(0, 0);
  };
  
  const progressPercent = calculateProgress(formData);

  // Render Dashboard View
  if (viewMode === 'dashboard') {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Nav for Dashboard */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                         <h1 className="text-xl font-bold text-gray-800">AI-First <span className="text-indigo-600">Analytics</span></h1>
                    </div>
                    <button
                        onClick={() => setViewMode('survey')}
                        className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path></svg>
                        Back to Survey
                    </button>
                </div>
            </div>
            <Dashboard />
        </div>
    );
  }

  // Render Thank You View
  if (formComplete) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-10 text-center">
                <svg className="w-20 h-20 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h1 className="text-3xl font-bold text-gray-800 mt-4">Thank You!</h1>
                <p className="text-gray-600 mt-2">Your insights have been successfully recorded.</p>
                <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                    <button
                        onClick={handleStartNewSurvey}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                    >
                        Submit Another Response
                    </button>
                                        
                    <button
                      onClick={() => setViewMode('dashboard')}
                      className="px-6 py-2.5 bg-white text-indigo-600 border border-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                    >
                      View Analysis Dashboard
                    </button>
                    
                </div>
            </div>
        </div>
    );
  }

  // Render Survey View
  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      
        {/* Floating Sticky Header */}
        <div className="sticky top-0 z-40 bg-slate-100/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
            <div className="container mx-auto max-w-4xl px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                        <h1 className="text-xl font-bold text-gray-800">AI-First Impact Survey</h1>
                     </div>
                                              
                          <button
                            onClick={() => setViewMode('dashboard')}
                            className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                          >
                            View Dashboard
                          </button>
                         
                </div>
                
                <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-medium text-gray-600 truncate pr-2">
                        Current: <span className="font-semibold text-indigo-700">{currentSectionTitle}</span>
                    </span>
                    <span className="font-medium text-indigo-700">{progressPercent}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}>
                    </div>
                </div>
            </div>
        </div>

      <div className="container mx-auto max-w-4xl py-8 px-4 pt-6">
        <div className="text-center mb-8">
          <p className="text-gray-600 max-w-2xl mx-auto">Over the past months, you've been part of AI-First—sprints, workshops, clinics, and showcases. This survey captures what worked, what transformed, and where we go next. Your insights shape Phase 2.</p>
          <p className="mt-2 text-sm text-indigo-600 font-semibold">Estimated time: 5 minutes</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {SURVEY_DATA.map((section, sectionIndex) => (
            <div 
              key={sectionIndex} 
              className="mb-10"
              ref={el => { sectionRefs.current[sectionIndex] = el; }}
            >
              <div className="bg-indigo-600 text-white p-4 rounded-t-lg shadow-md sticky top-[108px] z-30">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                {section.description && <p className="text-indigo-200 text-sm mt-1">{section.description}</p>}
              </div>
              <div className="bg-slate-50 p-4 sm:p-6 rounded-b-lg shadow-md">
                {section.questions.map((question) => (
                    <QuestionRenderer
                      key={question.id}
                      question={question}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      isInvalid={invalidQuestionIds.has(question.id)}
                    />
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200 shadow-lg flex justify-end items-center mt-8 rounded-t-xl z-40">
             {invalidQuestionIds.size > 0 && <p className='text-red-600 mr-4 text-sm font-medium'>Please fill out all required fields.</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 flex items-center ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
              ) : 'Submit Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
