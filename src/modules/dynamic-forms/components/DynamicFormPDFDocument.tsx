import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { DynamicForm, FormField } from '../types';

// Professional PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header Section - Professional with logo and company info
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: '#E53935',
    borderBottomStyle: 'solid',
  },
  logoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 280,
    height: 120,
    objectFit: 'contain',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: 200,
  },
  documentLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  documentDate: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
  },
  
  // Title Section
  titleSection: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  
  // Content
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 80,
    flex: 1,
  },
  
  // Description
  // Title & Description Section - Professional Text Style
  infoSection: {
    marginBottom: 28,
  },
  infoBlock: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  infoDescription: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
  },
  
  // Fields Container
  fieldsContainer: {
    marginTop: 8,
  },
  
  // Section Header
  sectionHeader: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    marginBottom: 20,
    marginTop: 28,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
    borderLeftStyle: 'solid',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
  },
  
  // Field Row - Card Style
  fieldRow: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRequired: {
    color: '#E53935',
    marginLeft: 2,
  },
  fieldDescription: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  fieldValue: {
    fontSize: 12,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    minHeight: 28,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
  },
  fieldValueEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Options Display
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  optionCheckbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 4,
    marginRight: 12,
  },
  optionCheckboxChecked: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  optionRadio: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 8,
    marginRight: 12,
  },
  optionRadioSelected: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  optionLabel: {
    fontSize: 11,
    color: '#374151',
  },
  
  // Rating Stars
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  star: {
    fontSize: 18,
    color: '#E5E7EB',
  },
  starFilled: {
    color: '#F59E0B',
  },
  
  // Signature Box
  signatureBox: {
    height: 100,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
  },
  footerCompany: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pageNumber: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

interface DynamicFormPDFDocumentProps {
  form: DynamicForm;
  formValues: Record<string, any>;
  language: 'en' | 'fr';
  companySettings?: {
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  submittedBy?: string;
  submittedAt?: Date;
}

export function DynamicFormPDFDocument({
  form,
  formValues,
  language,
  companySettings,
  submittedBy,
  submittedAt,
}: DynamicFormPDFDocumentProps) {
  const formName = language === 'en' ? form.name_en : form.name_fr;
  const formDescription = language === 'en' ? form.description_en : form.description_fr;
  
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderFieldValue = (field: FormField) => {
    const value = formValues[field.id];
    const label = language === 'en' ? field.label_en : field.label_fr;
    const description = language === 'en' ? field.description_en : field.description_fr;
    
    // Section headers
    if (field.type === 'section') {
      return (
        <View key={field.id} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{label}</Text>
          {description && <Text style={styles.sectionDescription}>{description}</Text>}
        </View>
      );
    }
    
    // Page breaks - skip in PDF
    if (field.type === 'page_break') {
      return null;
    }
    
    return (
      <View key={field.id} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>
          {label}
          {field.required && <Text style={styles.fieldRequired}> *</Text>}
        </Text>
        {description && <Text style={styles.fieldDescription}>{description}</Text>}
        
        {/* Render based on field type */}
        {field.type === 'checkbox' && field.options && field.options.length > 0 ? (
          <View>
            {field.options.map((opt) => {
              const isChecked = Array.isArray(value) && value.includes(opt.value);
              const optLabel = language === 'en' ? opt.label_en : opt.label_fr;
              return (
                <View key={opt.id} style={styles.optionRow}>
                  <View style={[styles.optionCheckbox, isChecked && styles.optionCheckboxChecked]} />
                  <Text style={styles.optionLabel}>{optLabel}</Text>
                </View>
              );
            })}
          </View>
        ) : field.type === 'radio' && field.options ? (
          <View>
            {field.options.map((opt) => {
              const isSelected = value === opt.value;
              const optLabel = language === 'en' ? opt.label_en : opt.label_fr;
              return (
                <View key={opt.id} style={styles.optionRow}>
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]} />
                  <Text style={styles.optionLabel}>{optLabel}</Text>
                </View>
              );
            })}
          </View>
        ) : field.type === 'select' && field.options ? (
          <View style={styles.fieldValue}>
            <Text style={!value ? styles.fieldValueEmpty : undefined}>
              {value 
                ? field.options.find(o => o.value === value)?.[language === 'en' ? 'label_en' : 'label_fr'] || value
                : '—'}
            </Text>
          </View>
        ) : field.type === 'rating' ? (
          <View style={styles.starsContainer}>
            {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
              <Text key={i} style={[styles.star, i < (value || 0) && styles.starFilled]}>
                ★
              </Text>
            ))}
          </View>
        ) : field.type === 'signature' ? (
          <View style={styles.signatureBox}>
            {value ? (
              <Image src={value} style={styles.signatureImage} />
            ) : (
              <Text style={styles.signaturePlaceholder}>
                {language === 'fr' ? 'Signature requise' : 'Signature required'}
              </Text>
            )}
          </View>
        ) : field.type === 'checkbox' && (!field.options || field.options.length === 0) ? (
          <View style={styles.optionRow}>
            <View style={[styles.optionCheckbox, value && styles.optionCheckboxChecked]} />
            <Text style={styles.optionLabel}>{value ? (language === 'fr' ? 'Oui' : 'Yes') : (language === 'fr' ? 'Non' : 'No')}</Text>
          </View>
        ) : (
          <View style={styles.fieldValue}>
            <Text style={!value ? styles.fieldValueEmpty : undefined}>
              {value || '—'}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Professional Header */}
        <View style={styles.headerContainer}>
          {/* Logo */}
          <View style={styles.logoSection}>
            {companySettings?.logo && (
              <Image src={companySettings.logo} style={styles.logoImage} />
            )}
          </View>
          
          {/* Document Info */}
          <View style={styles.headerRight}>
            <Text style={styles.documentLabel}>
              {language === 'fr' ? 'Complété le' : 'Completed on'}
            </Text>
            <Text style={styles.documentDate}>
              {formatDate(submittedAt || new Date())}
            </Text>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title & Description - Professional Text Style */}
          <View style={styles.infoSection}>
            {/* Title */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>
                {language === 'fr' ? 'Titre' : 'Title'}
              </Text>
              <Text style={styles.infoTitle}>{formName}</Text>
            </View>
            
            {/* Description */}
            {formDescription && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>
                  {language === 'fr' ? 'Description' : 'Description'}
                </Text>
                <Text style={styles.infoDescription}>{formDescription}</Text>
              </View>
            )}
          </View>
          
          {/* Fields */}
          <View style={styles.fieldsContainer}>
            {sortedFields.map(renderFieldValue)}
          </View>
        </View>
        
        {/* Professional Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              {language === 'fr' ? 'Document généré le' : 'Document generated on'} {formatDateTime(new Date())}
            </Text>
            {companySettings?.name && (
              <Text style={styles.footerCompany}>
                © {new Date().getFullYear()} {companySettings.name}
              </Text>
            )}
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}
