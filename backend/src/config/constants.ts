export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const;
