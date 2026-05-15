/**
 * React PDF Component for handling long fields professionally
 * Provides consistent layout handling across all PDF documents
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import {
  shouldStackField,
  formatLongText,
  getFieldDisplayStrategy,
} from '@/shared/utils/pdfLongFieldUtils';

// Default styles for the component
const defaultStyles = StyleSheet.create({
  // Inline layout (label | value on same row)
  fieldRowInline: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  
  // Stacked layout (label above value)
  fieldRowStacked: {
    flexDirection: 'column' as const,
    marginBottom: 6,
  },
  
  // Label styling
  fieldLabelInline: {
    fontSize: 9,
    color: '#6B7280',
    width: 85,
  },
  
  fieldLabelStacked: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: 'bold' as const,
  },
  
  // Value styling
  fieldValueInline: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
  
  fieldValueStacked: {
    fontSize: 9,
    color: '#1F2937',
    lineHeight: 1.3,
  },
  
  fieldValueTruncated: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
});

export interface LongFieldProps {
  label: string;
  value: string | undefined | null;
  fieldName?: string; // For intelligent strategy selection
  customStyles?: any; // To override default styles
  truncateLength?: number; // Truncation character limit
}

/**
 * LongFieldRow Component
 * Professionally handles both short and long field values
 * Automatically chooses between inline and stacked layouts
 * 
 * Usage:
 * <LongFieldRow label="Serial Number:" value={installation.serialNumber} fieldName="serialNumber" />
 */
export function LongFieldRow({
  label,
  value,
  fieldName,
  customStyles = {},
  truncateLength = 40,
}: LongFieldProps) {
  const strategy = getFieldDisplayStrategy(value, fieldName);
  const styles = { ...defaultStyles, ...customStyles };
  
  // No value, use inline to save space
  if (!value) {
    return (
      <View style={[styles.fieldRowInline]}>
        <Text style={styles.fieldLabelInline}>{label}</Text>
        <Text style={styles.fieldValueInline}>-</Text>
      </View>
    );
  }
  
  // Stacked layout for very long values
  if (strategy === 'stacked') {
    return (
      <View style={styles.fieldRowStacked}>
        <Text style={styles.fieldLabelStacked}>{label}</Text>
        <Text style={styles.fieldValueStacked}>{value}</Text>
      </View>
    );
  }
  
  // Truncated layout for moderately long values
  if (strategy === 'truncated') {
    return (
      <View style={[styles.fieldRowInline]}>
        <Text style={styles.fieldLabelInline}>{label}</Text>
        <Text style={styles.fieldValueTruncated}>
          {formatLongText(value, { maxLength: truncateLength, truncate: true })}
        </Text>
      </View>
    );
  }
  
  // Default inline layout for normal length values
  return (
    <View style={styles.fieldRowInline}>
      <Text style={styles.fieldLabelInline}>{label}</Text>
      <Text style={styles.fieldValueInline}>{value}</Text>
    </View>
  );
}

/**
 * Installation Details Section with intelligent long-field handling
 * Ideal for displaying installation information in PDFs
 */
export interface InstallationDetailsProps {
  installation: any; // Installation data object
  translations: any; // Translation object
  styles: any; // Stylesheet with infoBoxTitle style
  customFieldStyles?: any; // Custom field styles
}

export function InstallationDetailsSection({
  installation,
  translations: t,
  styles: baseStyles,
  customFieldStyles = {},
}: InstallationDetailsProps) {
  if (!installation) return null;
  
  return (
    <View style={baseStyles.installBox || baseStyles.sectionBox}>
      <Text style={baseStyles.infoBoxTitle || baseStyles.sectionTitle}>
        {t.installationInfo || 'Installation Information'}
      </Text>
      
      {installation.name && (
        <LongFieldRow
          label={t.installationName || 'Name:'}
          value={installation.name}
          fieldName="installationName"
          customStyles={customFieldStyles}
        />
      )}
      
      {installation.model && (
        <LongFieldRow
          label={t.model || 'Model:'}
          value={installation.model}
          fieldName="model"
          customStyles={customFieldStyles}
        />
      )}
      
      {installation.serialNumber && (
        <LongFieldRow
          label={t.serialNumber || 'Serial Number:'}
          value={installation.serialNumber}
          fieldName="serialNumber"
          customStyles={customFieldStyles}
        />
      )}
      
      {installation.matricule && (
        <LongFieldRow
          label={t.matricule || 'Matricule:'}
          value={installation.matricule}
          fieldName="matricule"
          customStyles={customFieldStyles}
        />
      )}
      
      {installation.manufacturer && (
        <LongFieldRow
          label={t.manufacturer || 'Manufacturer:'}
          value={installation.manufacturer}
          fieldName="manufacturer"
          customStyles={customFieldStyles}
        />
      )}
      
      {installation.location && (
        <LongFieldRow
          label={t.location || 'Location:'}
          value={installation.location}
          fieldName="location"
          customStyles={customFieldStyles}
        />
      )}
    </View>
  );
}