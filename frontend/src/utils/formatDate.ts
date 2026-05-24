/**
 * Formats a date string or object safely, preventing crashes in Safari iOS
 * where invalid dates or standard ISO formats with certain zones can throw RangeErrors.
 */
export const safeFormatDate = (dateVal: any): string => {
  if (!dateVal) return 'N/A';
  try {
    let parsedDate: Date;
    if (typeof dateVal === 'string') {
      // Replace dashes with slashes and replace T with space for reliable Safari parsing
      const cleaned = dateVal.replace(/-/g, '/').replace('T', ' ').split('.')[0];
      parsedDate = new Date(cleaned);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date(dateVal);
      }
    } else {
      parsedDate = new Date(dateVal);
    }

    if (isNaN(parsedDate.getTime())) {
      return 'Invalid Date';
    }

    return parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};
