export type QuestionType = 'MCQ' | 'TEXT';
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: readonly string[];
}

export interface Survey {
  id: string;
  title: string;
  department: string;
  status: SurveyStatus;
  assignedBranch: string;
  questions: readonly Question[];
  responses: number;
}

export interface CreateSurveyPayload {
  title: string;
  department: string;
  assignedBranch: string;
}

export interface CreateQuestionPayload {
  surveyId: string;
  text: string;
  type: QuestionType;
  options: readonly string[];
}
