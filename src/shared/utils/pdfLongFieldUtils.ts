/**
 * Utility functions for handling long text fields in PDF documents
 * Provides professional solutions for serial numbers, matricule, and other lengthy fields
 */

/**
 * Determines if a text value is considered "long" based on character count
 * Typical threshold: 30+ characters causes wrapping issues in standard PDF layouts
 */
export const isLongField = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return value.length > 30;
};

/**
 * Check if a field should use stacked layout (label above value)
 * Stacking is recommended for values longer than 50 characters
 */
export const shouldStackField = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return value.length > 50;
};

/**
 * Truncates very long text with ellipsis for display in constrained spaces
 * Keeps the first part of the text (usually more meaningful) and shows "..."
 */
export const truncateText = (text: string | undefined | null, maxLength: number = 35): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Smart text handling for PDF fields
 * Returns the text with optional truncation based on length
 */
export const formatLongText = (
  text: string | undefined | null,
  options: {
    maxLength?: number;
    truncate?: boolean;
  } = {}
): string => {
  const { maxLength = 40, truncate = true } = options;
  
  if (!text) return '-';
  if (!truncate) return text;
  if (text.length <= maxLength) return text;
  
  return truncateText(text, maxLength);
};

/**
 * Calculate whether multiple fields in a row would exceed reasonable PDF width
 * Helps determine if fields should be reorganized into separate rows
 */
export const shouldReflowFields = (fields: (string | undefined | null)[]): boolean => {
  const totalChars = fields.reduce((sum, field) => {
    return sum + (field ? field.length : 0);
  }, 0);
  
  // If combined length exceeds 100 characters, suggest reflow
  return totalChars > 100;
};

/**
 * Styles configuration for long field handling in PDFs
 * These should be merged with your existing stylesheet
 */
export const longFieldStyles = {
  // For fields that need full-width vertically-stacked display
  infoRowStacked: {
    flexDirection: 'column' as const,
    marginBottom: 6,
  },
  
  // For labels in stacked layout (appears above value)
  infoLabelStacked: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: 'bold' as const,
  },
  
  // For values in stacked layout (appears below label)
  infoValueStacked: {
    fontSize: 9,
    color: '#1F2937',
    wordWrap: 'break-word' as const,
  },
  
  // Alternative: condensed value for readonly fields
  infoValueCondensed: {
    fontSize: 8,
    color: '#1F2937',
    lineHeight: 1.2,
  },
  
  // For very long fields that span full width
  longFieldContainer: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
};

/**
 * Predicate to identify fields that frequently cause layout issues
 * Used to apply automatic formatting to problematic field types
 */
export const isProblematicFieldType = (fieldName: string): boolean => {
  const problematicFields = [
    'serial',
    'serialNumber',
    'matricule',
    'vehicleIdentificationNumber',
    'vin',
    'registration',
    'licenseplate',
    'installationName',
    'description',
    'notes',
    'address',
    'url',
  ];
  
  return problematicFields.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
};

/**
 * Get recommended display strategy for a field
 * Returns: 'inline' | 'stacked' | 'truncated'
 */
export const getFieldDisplayStrategy = (
  value: string | undefined | null,
  fieldName?: string
): 'inline' | 'stacked' | 'truncated' => {
  if (!value) return 'inline';
  
  // Serial numbers and matricule should ALWAYS be stacked to prevent wrapping issues
  // These fields are inherently problematic even at shorter lengths (15+ chars)
  if (fieldName) {
    const lowerFieldName = fieldName.toLowerCase();
    if (lowerFieldName.includes('serial') || lowerFieldName.includes('matricule')) {
      return 'stacked';
    }
  }
  
  // If field is known to be problematic and has any content, prefer stacking
  if (fieldName && isProblematicFieldType(fieldName) && value && value.length > 15) {
    return 'stacked';
  }
  
  // For very long values, use stacking (> 50 chars)
  if (shouldStackField(value)) {
    return 'stacked';
  }
  
  // For moderately long values (30-50 chars), truncate
  if (isLongField(value)) {
    return 'truncated';
  }
  
  return 'inline';
};