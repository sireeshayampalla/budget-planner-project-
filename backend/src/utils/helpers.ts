/**
 * Gets the first and last Date objects for a given month and year.
 */
export const getMonthDateRange = (month: number, year: number) => {
  // month is 1-12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Validates if a date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const d = new Date(dateString);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Format numbers to 2 decimal places
 */
export const formatAmount = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};
