import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FormField } from '../../types';

// Professional PDF Styles - matching the preview exactly
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header Section
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
  logoPlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 240,
    height: 105,
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
  
  // Content
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 80,
    flex: 1,
  },
  
  // Title & Description Section
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
  
  // Page Break
  pageBreak: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 12,
  },
  pageBreakLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  pageBreakLabel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pageBreakText: {
    fontSize: 10,
    color: '#E53935',
    fontWeight: 'bold',
  },
  
  // Content Block (for content type fields)
  contentBlock: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginBottom: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  contentDescription: {
    fontSize: 10,
    color: '#6B7280',
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
  fieldInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
  },
  fieldTextarea: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
  },
  fieldPlaceholder: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Options Display
  optionsContainer: {
    marginTop: 4,
  },
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
    backgroundColor: '#FFFFFF',
  },
  optionRadio: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  optionLabel: {
    fontSize: 11,
    color: '#374151',
  },
  
  // Rating Stars
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 6,
  },
  star: {
    fontSize: 18,
    color: '#E5E7EB',
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

interface FormTemplatePDFProps {
  formName: string;
  formDescription?: string;
  fields: FormField[];
  language: 'en' | 'fr';
  companySettings?: {
    name?: string;
    logo?: string;
  };
}

export function FormTemplatePDF({
  formName,
  formDescription,
  fields,
  language,
  companySettings,
}: FormTemplatePDFProps) {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const renderField = (field: FormField) => {
    const label = language === 'en' ? field.label_en : field.label_fr;
    const description = language === 'en' ? field.description_en : field.description_fr;
    const placeholder = language === 'en' ? field.placeholder_en : field.placeholder_fr;
    
    // Section headers
    if (field.type === 'section') {
      return (
        <View key={field.id} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{label}</Text>
          {description && <Text style={styles.sectionDescription}>{description}</Text>}
        </View>
      );
    }
    
    // Page breaks
    if (field.type === 'page_break') {
      return (
        <View key={field.id} style={styles.pageBreak}>
          <View style={styles.pageBreakLine} />
          <View style={styles.pageBreakLabel}>
            <Text style={styles.pageBreakText}>
              {language === 'fr' ? 'Saut de page' : 'Page Break'}
            </Text>
          </View>
          <View style={styles.pageBreakLine} />
        </View>
      );
    }
    
    // Content blocks
    if (field.type === 'content') {
      return (
        <View key={field.id} style={styles.contentBlock}>
          <Text style={styles.contentTitle}>{label}</Text>
          {description && <Text style={styles.contentDescription}>{description}</Text>}
        </View>
      );
    }
    
    // Regular field types
    return (
      <View key={field.id} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>
          {label}
          {field.required && <Text style={styles.fieldRequired}> *</Text>}
        </Text>
        {description && <Text style={styles.fieldDescription}>{description}</Text>}
        
        {/* Render input based on field type */}
        {(field.type === 'checkbox' || field.type === 'radio') && field.options && field.options.length > 0 ? (
          <View style={styles.optionsContainer}>
            {field.options.map((opt) => {
              const optLabel = language === 'en' ? opt.label_en : opt.label_fr;
              return (
                <View key={opt.id} style={styles.optionRow}>
                  <View style={field.type === 'checkbox' ? styles.optionCheckbox : styles.optionRadio} />
                  <Text style={styles.optionLabel}>{optLabel}</Text>
                </View>
              );
            })}
          </View>
        ) : field.type === 'checkbox' && (!field.options || field.options.length === 0) ? (
          <View style={styles.optionRow}>
            <View style={styles.optionCheckbox} />
            <Text style={styles.optionLabel}>{language === 'fr' ? 'Oui' : 'Yes'}</Text>
          </View>
        ) : field.type === 'select' && field.options ? (
          <View style={styles.fieldInput}>
            <Text style={styles.fieldPlaceholder}>
              {placeholder || (language === 'fr' ? 'Sélectionner...' : 'Select...')}
            </Text>
          </View>
        ) : field.type === 'rating' ? (
          <View style={styles.starsContainer}>
            {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
              <Text key={i} style={styles.star}>★</Text>
            ))}
          </View>
        ) : field.type === 'signature' ? (
          <View style={styles.signatureBox}>
            <Text style={styles.signaturePlaceholder}>
              {language === 'fr' ? 'Signer ici' : 'Sign here'}
            </Text>
          </View>
        ) : field.type === 'textarea' ? (
          <View style={styles.fieldTextarea}>
            <Text style={styles.fieldPlaceholder}>
              {placeholder || (language === 'fr' ? 'Entrez votre réponse...' : 'Enter your response...')}
            </Text>
          </View>
        ) : (
          <View style={styles.fieldInput}>
            <Text style={styles.fieldPlaceholder}>
              {placeholder || (language === 'fr' ? 'Entrez une valeur...' : 'Enter a value...')}
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
            {companySettings?.logo ? (
              <Image src={companySettings.logo} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 24, color: '#9CA3AF' }}>📄</Text>
              </View>
            )}
          </View>
          
          {/* Document Info */}
          <View style={styles.headerRight}>
            <Text style={styles.documentLabel}>
              {language === 'fr' ? 'Date' : 'Date'}
            </Text>
            <Text style={styles.documentDate}>
              {formatDate(new Date())}
            </Text>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title & Description */}
          <View style={styles.infoSection}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>
                {language === 'fr' ? 'Titre' : 'Title'}
              </Text>
              <Text style={styles.infoTitle}>{formName}</Text>
            </View>
            
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
            {sortedFields.map(renderField)}
          </View>
        </View>
        
        {/* Professional Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              {formName}
            </Text>
            <Text style={styles.footerCompany}>
              © {new Date().getFullYear()} {companySettings?.name || 'Flow Service'}
            </Text>
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}
