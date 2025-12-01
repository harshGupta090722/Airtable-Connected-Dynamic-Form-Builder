
/**
 * Evaluate a single condition against answersSoFar.
 *
 * @param {Object} condition
 * @param {Record<string, any>} answersSoFar
 * @returns {boolean}
 */
function evaluateCondition(condition, answersSoFar) {
  const { questionKey, operator, value } = condition;
  const answer = answersSoFar[questionKey];

  if (answer === undefined || answer === null) {
    return false;
  }

  switch (operator) {
    case "equals":
      return answer === value;

    case "notEquals":
      return answer !== value;

    case "contains":
      if (Array.isArray(answer)) {
        return answer.includes(value);
      }
      if (typeof answer === "string") {
        return String(answer).includes(String(value));
      }
      return false;

    case "<":
      return Number(answer) < Number(value);

    case "<=":
      return Number(answer) <= Number(value);

    case ">":
      return Number(answer) > Number(value);

    case ">=":
      return Number(answer) >= Number(value);

    default:
      return true;
  }
}

/**
 * Pure conditional-visibility helper.
 *
 * @param {Object | null | undefined} rules
 * @param {Record<string, any>} answersSoFar
 * @returns {boolean}
 */
export function shouldShowQuestion(rules, answersSoFar) {
  if (
    !rules ||
    !Array.isArray(rules.conditions) ||
    rules.conditions.length === 0
  ) {
    return true;
  }

  const { logic, conditions } = rules;

  const results = conditions.map((cond) =>
    evaluateCondition(cond, answersSoFar)
  );

  if (logic === "AND") {
    return results.every(Boolean);
  }

  return results.some(Boolean);
}