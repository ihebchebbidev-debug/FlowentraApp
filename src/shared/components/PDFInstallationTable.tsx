/**
 * Installation Details Table Component for PDF
 * Displays all installation fields in a structured table layout
 * with labels above values in separate columns
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';

const tableStyles = StyleSheet.create({
  // Table container
  installationTable: {
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },

  // Table header row (labels)
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
    borderBottomStyle: 'solid',
  },

  // Table data row (values)
  tableDataRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    minHeight: 40,
  },

  // Column container
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    borderRightStyle: 'solid',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Serial number column (wider)
  serialColumn: {
    flex: 1.5,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    borderRightStyle: 'solid',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Last column (no right border)
  columnLast: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Header label text
  headerLabel: {
    fontSize: 8,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: 'bold',
    lineHeight: 1.3,
  },

  // Data value text
  dataValue: {
    fontSize: 10,
    color: '#1F2937',
    lineHeight: 1.4,
    fontWeight: 'normal',
  },
});

export interface InstallationTableProps {
  installation: any;
  translations: any;
}

/**
 * InstallationDataTable Component
 * Renders installation details in a professional table format
 * with labels above values in columns
 */
export function InstallationDataTable({
    installation,
    translations: t,
}: InstallationTableProps) {
    if (!installation) return null;

    // Always display these fields in this order, even if some are empty
    // Maps field property name to translation key and default label
    const fieldOrder = [
        { key: 'model', translationKey: 'model', defaultLabel: 'Model', field: 'model' },
        { key: 'serialNumber', translationKey: 'serialNumber', defaultLabel: 'Serial Number', field: 'serialNumber' },
        { key: 'matricule', translationKey: 'matricule', defaultLabel: 'Matricule', field: 'matricule' },
        { key: 'manufacturer', translationKey: 'manufacturer', defaultLabel: 'Manufacturer', field: 'manufacturer' },
    ];

    // Always display all fields to provide complete installation information
    const columns = fieldOrder.map(field => {
        // Try primary field first, then alternate field, then return '-'
        const value = (installation as any)[field.field] || 
                      ((field as any).altField ? (installation as any)[(field as any).altField] : undefined) || 
                      '-';
        return {
            key: field.key,
            label: (t as any)[field.translationKey] || field.defaultLabel,
            value: value,
        };
    });

    // Only render if we have installation data with at least a name or one other field
    const hasData = installation && Object.keys(installation).length > 0 &&
                    (installation.name || installation.model || installation.serialNumber);

    if (!hasData) return null;

    // Always display all columns, even if empty (will show "-")
    const colsToDisplay = columns;

    return (
        <View style={tableStyles.installationTable}>
            {/* Header row with labels */}
            <View style={tableStyles.tableHeaderRow}>
                {colsToDisplay.map((col, idx) => (
                    <View
                        key={col.key}
                        style={idx === colsToDisplay.length - 1 ? tableStyles.columnLast : tableStyles.column}
                    >
                        <Text style={tableStyles.headerLabel}>{col.label}</Text>
                    </View>
                ))}
            </View>

            {/* Data row with  values */}
            <View style={tableStyles.tableDataRow}>
                {colsToDisplay.map((col, idx) => (
                    <View
                        key={col.key}
                        style={idx === colsToDisplay.length - 1 ? tableStyles.columnLast : tableStyles.column}
                    >
                        <Text style={tableStyles.dataValue}>{col.value || '-'}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}