
export enum QuestionType {
  DROPDOWN = 'DROPDOWN',
  CHECKBOX_WITH_TEXT = 'CHECKBOX_WITH_TEXT',
  RADIO = 'RADIO',
  TEXTAREA = 'TEXTAREA',
  CONDITIONAL_RADIO = 'CONDITIONAL_RADIO',
  MULTI_SELECT_CHECKBOX = 'MULTI_SELECT_CHECKBOX',
  SLIDER_PAIR = 'SLIDER_PAIR',
  GROUPED_CHECKBOX = 'GROUPED_CHECKBOX',
  CHECKBOX = 'CHECKBOX',
  TEXT = 'TEXT'
}

export interface Option {
  value: string;
  label: string;
  hasTextInput?: boolean;
  textInputLabel?: string;
  group?: string;
}

export interface SubQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  triggerValues: string[];
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: Option[];
  description?: string;
  subQuestion?: SubQuestion;
  limit?: number;
}

export interface SurveySection {
  title: string;
  description?: string;
  questions: Question[];
}

export interface FormData {
  [key: string]: any;
}
