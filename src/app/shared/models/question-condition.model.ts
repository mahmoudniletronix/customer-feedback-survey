export const QUESTION_CONDITION_TRIGGER_TYPE = {
  SingleChoiceOption: 1,
  StarRatingValue: 2,
  SmileValue: 3,
} as const;

export type QuestionConditionTriggerType =
  (typeof QUESTION_CONDITION_TRIGGER_TYPE)[keyof typeof QUESTION_CONDITION_TRIGGER_TYPE];

export interface QuestionCondition {
  conditionId: string;
  templateId?: string;
  parentTemplateQuestionId: string;
  childTemplateQuestionId: string;
  triggerType: QuestionConditionTriggerType;
  triggerTypeName: string;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  order: number;
}

export interface QuestionConditionApiResponse {
  conditionId?: string | number;
  templateId?: string | number;
  parentTemplateQuestionId?: string | number;
  childTemplateQuestionId?: string | number;
  triggerType?: number | string | null;
  triggerTypeName?: string | null;
  selectedQuestionOptionId?: string | number | null;
  triggerValue?: number | null;
  order?: number | null;
}

export interface QuestionConditionPayload {
  parentTemplateQuestionId: string;
  childTemplateQuestionId: string;
  triggerType: QuestionConditionTriggerType;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  order: number;
}

export interface UpdateQuestionConditionsPayload {
  conditions: readonly QuestionConditionPayload[];
}

export interface ConditionalQuestionNode {
  templateQuestionId: string;
  order: number | null;
}

export interface TemplateQuestionTreeNode<TQuestion extends ConditionalQuestionNode> {
  question: TQuestion;
  conditionFromParent: QuestionCondition | null;
  children: readonly TemplateQuestionTreeNode<TQuestion>[];
}

export interface BuildTemplateQuestionTreeResult<TQuestion extends ConditionalQuestionNode> {
  roots: readonly TemplateQuestionTreeNode<TQuestion>[];
  warnings: readonly string[];
}

export interface ConditionalQuestionAnswerState {
  selectedQuestionOptionId: string;
  starRatingValue: number | null;
  smileValue: number | null;
}

export function toQuestionCondition(response: QuestionConditionApiResponse): QuestionCondition {
  const triggerType = toQuestionConditionTriggerType(response.triggerType);

  return {
    conditionId: readRecordId(response.conditionId),
    templateId: readRecordId(response.templateId),
    parentTemplateQuestionId: readRecordId(response.parentTemplateQuestionId),
    childTemplateQuestionId: readRecordId(response.childTemplateQuestionId),
    triggerType,
    triggerTypeName: response.triggerTypeName ?? triggerTypeName(triggerType),
    selectedQuestionOptionId: readNullableRecordId(response.selectedQuestionOptionId),
    triggerValue: response.triggerValue ?? null,
    order: response.order ?? 0,
  };
}

export function toQuestionConditionPayload(condition: QuestionCondition): QuestionConditionPayload {
  return {
    parentTemplateQuestionId: condition.parentTemplateQuestionId,
    childTemplateQuestionId: condition.childTemplateQuestionId,
    triggerType: condition.triggerType,
    selectedQuestionOptionId: condition.selectedQuestionOptionId,
    triggerValue: condition.triggerValue,
    order: condition.order,
  };
}

export function buildVisibleQuestionIds(
  questions: readonly ConditionalQuestionNode[],
  conditions: readonly QuestionCondition[],
  answers: Readonly<Record<string, ConditionalQuestionAnswerState>>,
): ReadonlySet<string> {
  return new Set(buildVisibleQuestionOrder(questions, conditions, answers));
}

export function buildVisibleQuestionOrder(
  questions: readonly ConditionalQuestionNode[],
  conditions: readonly QuestionCondition[],
  answers: Readonly<Record<string, ConditionalQuestionAnswerState>>,
): readonly string[] {
  const tree = buildTemplateQuestionTree(questions, conditions);
  const orderedVisibleIds: string[] = [];

  const visitNode = (node: TemplateQuestionTreeNode<ConditionalQuestionNode>): void => {
    orderedVisibleIds.push(node.question.templateQuestionId);

    const answer = answers[node.question.templateQuestionId];
    if (!answer) {
      return;
    }

    node.children
      .filter(
        (child) =>
          child.conditionFromParent !== null &&
          isQuestionConditionMatch(child.conditionFromParent, answer),
      )
      .forEach((child) => visitNode(child));
  };

  tree.roots.forEach((root) => visitNode(root));
  return orderedVisibleIds;
}

export function buildTemplateQuestionTree<TQuestion extends ConditionalQuestionNode>(
  questions: readonly TQuestion[],
  conditions: readonly QuestionCondition[],
): BuildTemplateQuestionTreeResult<TQuestion> {
  const warnings: string[] = [];
  const questionIds = new Set(
    questions
      .map((question) => question.templateQuestionId)
      .filter((templateQuestionId) => templateQuestionId.length > 0),
  );
  const questionsByTemplateQuestionId = new Map(
    questions
      .filter((question) => questionIds.has(question.templateQuestionId))
      .map((question) => [question.templateQuestionId, question]),
  );
  const conditionsByParent = new Map<string, QuestionCondition[]>();

  for (const condition of conditions) {
    if (!questionsByTemplateQuestionId.has(condition.parentTemplateQuestionId)) {
      warnings.push(
        `Condition ${condition.conditionId} has missing parentTemplateQuestionId ${condition.parentTemplateQuestionId}`,
      );
      continue;
    }

    if (!questionsByTemplateQuestionId.has(condition.childTemplateQuestionId)) {
      warnings.push(
        `Condition ${condition.conditionId} has missing childTemplateQuestionId ${condition.childTemplateQuestionId}`,
      );
      continue;
    }

    const parentConditions = conditionsByParent.get(condition.parentTemplateQuestionId) ?? [];
    parentConditions.push(condition);
    conditionsByParent.set(condition.parentTemplateQuestionId, parentConditions);
  }

  const childIds = new Set(
    [...conditionsByParent.values()].flat().map((condition) => condition.childTemplateQuestionId),
  );
  const rootQuestions = [...questionsByTemplateQuestionId.values()]
    .filter((question) => !childIds.has(question.templateQuestionId))
    .sort(compareConditionalQuestionNodes);

  const buildNode = (
    question: TQuestion,
    conditionFromParent: QuestionCondition | null,
    path: ReadonlySet<string>,
  ): TemplateQuestionTreeNode<TQuestion> => {
    if (path.has(question.templateQuestionId)) {
      throw new Error(
        `Circular condition detected at templateQuestionId ${question.templateQuestionId}`,
      );
    }

    const nextPath = new Set(path);
    nextPath.add(question.templateQuestionId);

    const children = (conditionsByParent.get(question.templateQuestionId) ?? [])
      .map((condition): { condition: QuestionCondition; question: TQuestion } | null => {
        const childQuestion = questionsByTemplateQuestionId.get(condition.childTemplateQuestionId);
        return childQuestion ? { condition, question: childQuestion } : null;
      })
      .filter(
        (child): child is { condition: QuestionCondition; question: TQuestion } => child !== null,
      )
      .sort((first, second) =>
        compareQuestionConditionEdges(
          first.condition,
          first.question,
          second.condition,
          second.question,
        ),
      )
      .map((child) => buildNode(child.question, child.condition, nextPath));

    return {
      question,
      conditionFromParent,
      children,
    };
  };

  return {
    roots: rootQuestions.map((rootQuestion) => buildNode(rootQuestion, null, new Set())),
    warnings,
  };
}

function compareConditionalQuestionNodes(
  first: ConditionalQuestionNode,
  second: ConditionalQuestionNode,
): number {
  const orderComparison =
    (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER);

  return orderComparison !== 0
    ? orderComparison
    : first.templateQuestionId.localeCompare(second.templateQuestionId);
}

function compareQuestionConditionEdges(
  firstCondition: QuestionCondition,
  firstQuestion: ConditionalQuestionNode,
  secondCondition: QuestionCondition,
  secondQuestion: ConditionalQuestionNode,
): number {
  return firstCondition.order !== secondCondition.order
    ? firstCondition.order - secondCondition.order
    : compareConditionalQuestionNodes(firstQuestion, secondQuestion);
}

export function collectConditionDescendantIds(
  parentTemplateQuestionId: string,
  conditions: readonly QuestionCondition[],
): ReadonlySet<string> {
  const descendants = new Set<string>();
  const pendingIds = [parentTemplateQuestionId];

  for (let index = 0; index < pendingIds.length; index += 1) {
    const currentId = pendingIds[index];
    const childIds = conditions
      .filter((condition) => condition.parentTemplateQuestionId === currentId)
      .map((condition) => condition.childTemplateQuestionId);

    for (const childId of childIds) {
      if (descendants.has(childId)) {
        continue;
      }

      descendants.add(childId);
      pendingIds.push(childId);
    }
  }

  descendants.delete(parentTemplateQuestionId);
  return descendants;
}

export function createsQuestionConditionCycle(
  conditions: readonly QuestionCondition[],
  parentTemplateQuestionId: string,
  childTemplateQuestionId: string,
): boolean {
  if (parentTemplateQuestionId === childTemplateQuestionId) {
    return true;
  }

  return collectConditionDescendantIds(childTemplateQuestionId, [
    ...conditions,
    {
      conditionId: '',
      parentTemplateQuestionId,
      childTemplateQuestionId,
      triggerType: QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption,
      triggerTypeName: triggerTypeName(QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption),
      selectedQuestionOptionId: null,
      triggerValue: null,
      order: 0,
    },
  ]).has(parentTemplateQuestionId);
}

export function isQuestionConditionMatch(
  condition: QuestionCondition,
  answer: ConditionalQuestionAnswerState,
): boolean {
  if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
    return (
      condition.selectedQuestionOptionId !== null &&
      answer.selectedQuestionOptionId === condition.selectedQuestionOptionId
    );
  }

  if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
    return condition.triggerValue !== null && answer.starRatingValue === condition.triggerValue;
  }

  return condition.triggerValue !== null && answer.smileValue === condition.triggerValue;
}

export function questionConditionKey(condition: QuestionCondition): string {
  return [
    condition.parentTemplateQuestionId,
    condition.childTemplateQuestionId,
    condition.triggerType,
    condition.selectedQuestionOptionId ?? '',
    condition.triggerValue ?? '',
  ].join('|');
}

export function triggerTypeName(triggerType: QuestionConditionTriggerType): string {
  if (triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
    return 'SingleChoiceOption';
  }
  if (triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
    return 'StarRatingValue';
  }
  return 'SmileValue';
}

function toQuestionConditionTriggerType(
  value: number | string | null | undefined,
): QuestionConditionTriggerType {
  if (typeof value === 'string' && !Number.isFinite(Number(value))) {
    const normalized = value.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('star')) {
      return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
    }
    if (normalized.includes('smile')) {
      return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
    }
    return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
    return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
  }
  if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
    return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
  }
  return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
}

function readRecordId(id: string | number | undefined): string {
  return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
}

function readNullableRecordId(id: string | number | null | undefined): string | null {
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}
