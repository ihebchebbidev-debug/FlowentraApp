import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { DynamicForm, DynamicFormResponse, FormField } from '../types';
import { format } from 'date-fns';
import { organizeFieldsIntoPages, FormPage } from '../utils/pageUtils';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  logo: {
    width: 160,
    height: 67,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
  },
  pageIndicator: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 24,
  },
  metaItem: {
    width: '50%',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
    color: '#374151',
  },
  field: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 11,
    color: '#111827',
  },
  requiredBadge: {
    color: '#dc2626',
    marginLeft: 2,
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: 'contain',
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginTop: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    fontSize: 14,
    marginRight: 2,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#d1d5db',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#92400e',
  },
  notesContent: {
    fontSize: 10,
    color: '#78350f',
  },
  continuedHeader: {
    marginBottom: 20,
  },
  continuedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  continuedSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
});

// Translations for PDF (passed as prop since react-pdf doesn't support hooks)
const PDF_TRANSLATIONS = {
  en: {
    reportTitle: 'Form Response Report',
    submittedBy: 'Submitted By',
    submittedAt: 'Submitted At',
    formVersion: 'Form Version',
    linkedEntity: 'Linked Entity',
    notes: 'Notes',
    generatedOn: 'Generated on',
    page: 'Page',
    pageOf: 'of',
    notAnswered: 'Not answered',
    yes: 'Yes',
    no: 'No',
    continued: '(continued)',
    formPage: 'Form Page',
  },
  fr: {
    reportTitle: 'Rapport de Réponse au Formulaire',
    submittedBy: 'Soumis Par',
    submittedAt: 'Soumis Le',
    formVersion: 'Version du Formulaire',
    linkedEntity: 'Entité Liée',
    notes: 'Notes',
    generatedOn: 'Généré le',
    page: 'Page',
    pageOf: 'de',
    notAnswered: 'Non répondu',
    yes: 'Oui',
    no: 'Non',
    continued: '(suite)',
    formPage: 'Page du Formulaire',
  },
};

interface FormResponsePDFProps {
  form: DynamicForm;
  response: DynamicFormResponse;
  companyLogo?: string;
  companyName?: string;
  language?: 'en' | 'fr';
}

export function FormResponsePDF({ 
  form, 
  response, 
  companyLogo,
  companyName,
  language = 'en' 
}: FormResponsePDFProps) {
  const t = PDF_TRANSLATIONS[language];
  const isEnglish = language === 'en';

  const getFieldLabel = (field: FormField) => {
    return isEnglish ? field.label_en : field.label_fr;
  };

  const getFieldValue = (field: FormField) => {
    const value = response.responses[field.id];
    
    if (value === undefined || value === null || value === '') {
      return t.notAnswered;
    }

    switch (field.type) {
      case 'checkbox':
        if (typeof value === 'boolean') {
          return value ? t.yes : t.no;
        }
        if (Array.isArray(value)) {
          return value.map(v => {
            const opt = field.options?.find(o => o.value === v);
            return opt ? (isEnglish ? opt.label_en : opt.label_fr) : v;
          }).join(', ');
        }
        return String(value);
      
      case 'radio':
      case 'select':
        const option = field.options?.find(o => o.value === value);
        return option ? (isEnglish ? option.label_en : option.label_fr) : String(value);
      
      case 'date':
        try {
          return format(new Date(value), 'MMM d, yyyy');
        } catch {
          return String(value);
        }
      
      case 'rating':
        return `${value}/${field.maxStars || 5} ★`;
      
      case 'signature':
        return 'signature'; // Will render as image
      
      default:
        return String(value);
    }
  };

  const renderFieldValue = (field: FormField) => {
    const value = response.responses[field.id];

    // Signature - render as image
    if (field.type === 'signature' && value && typeof value === 'string' && value.startsWith('data:image')) {
      return <Image src={value} style={styles.signatureImage} />;
    }

    // Rating - render stars
    if (field.type === 'rating' && typeof value === 'number') {
      const maxStars = field.maxStars || 5;
      return (
        <View style={styles.ratingStars}>
          {Array.from({ length: maxStars }).map((_, i) => (
            <Text 
              key={i} 
              style={[styles.star, i < value ? styles.starFilled : styles.starEmpty]}
            >
              ★
            </Text>
          ))}
          <Text style={{ marginLeft: 8, fontSize: 10 }}>({value}/{maxStars})</Text>
        </View>
      );
    }

    return <Text style={styles.fieldValue}>{getFieldValue(field)}</Text>;
  };

  // Organize fields into pages
  const pages = organizeFieldsIntoPages(form.fields);
  const isMultiPage = pages.length > 1;

  // Group fields within a page by section
  const groupFieldsBySection = (fields: FormField[]) => {
    const grouped: { section: FormField | null; fields: FormField[] }[] = [];
    let currentSection: FormField | null = null;
    let currentFields: FormField[] = [];

    fields.forEach((field) => {
      if (field.type === 'section') {
        if (currentFields.length > 0 || currentSection) {
          grouped.push({ section: currentSection, fields: currentFields });
        }
        currentSection = field;
        currentFields = [];
      } else if (field.type !== 'page_break') {
        currentFields.push(field);
      }
    });
    
    if (currentFields.length > 0 || currentSection) {
      grouped.push({ section: currentSection, fields: currentFields });
    }

    return grouped;
  };

  const renderPageContent = (formPage: FormPage, pageIndex: number, isFirstPDFPage: boolean) => {
    const groupedFields = groupFieldsBySection(formPage.fields);

    return (
      <>
        {/* Page Title for multi-page forms */}
        {isMultiPage && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.pageIndicator}>
              {t.formPage} {formPage.pageNumber} {t.pageOf} {pages.length}
            </Text>
            {(formPage.title_en || formPage.title_fr) && (
              <Text style={styles.pageTitle}>
                {isEnglish ? formPage.title_en : formPage.title_fr}
              </Text>
            )}
          </View>
        )}

        {/* Form Fields by Section */}
        {groupedFields.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.section}>
            {group.section && (
              <Text style={styles.sectionTitle}>
                {isEnglish ? group.section.label_en : group.section.label_fr}
              </Text>
            )}
            {group.fields.map((field) => (
              <View key={field.id} style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {getFieldLabel(field)}
                  {field.required && <Text style={styles.requiredBadge}> *</Text>}
                </Text>
                {renderFieldValue(field)}
              </View>
            ))}
          </View>
        ))}
      </>
    );
  };

  // For multi-page forms, we create one PDF page per form page
  // For single-page forms, everything goes on one PDF page
  return (
    <Document>
      {pages.map((formPage, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header with Logo - only on first page or continued header on subsequent pages */}
          {pageIndex === 0 ? (
            <>
              <View style={styles.header}>
                {companyLogo ? (
                  <Image src={companyLogo} style={styles.logo} />
                ) : (
                  <View style={{ width: 120 }} />
                )}
                <View style={styles.companyInfo}>
                  {companyName && <Text style={styles.companyName}>{companyName}</Text>}
                  <Text style={styles.companyDetail}>{t.reportTitle}</Text>
                </View>
              </View>

              {/* Form Title */}
              <Text style={styles.title}>
                {isEnglish ? form.name_en : form.name_fr}
              </Text>
              {(form.description_en || form.description_fr) && (
                <Text style={styles.subtitle}>
                  {isEnglish ? form.description_en : form.description_fr}
                </Text>
              )}

              {/* Meta Information */}
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{t.submittedBy}</Text>
                  <Text style={styles.metaValue}>{response.submitted_by}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{t.submittedAt}</Text>
                  <Text style={styles.metaValue}>
                    {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{t.formVersion}</Text>
                  <Text style={styles.metaValue}>v{response.form_version}</Text>
                </View>
                {response.entity_type && response.entity_id && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t.linkedEntity}</Text>
                    <Text style={styles.metaValue}>
                      {response.entity_type}: {response.entity_id}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            // Continued header for subsequent pages
            <View style={styles.continuedHeader}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {companyLogo ? (
                  <Image src={companyLogo} style={{ width: 110, height: 46, objectFit: 'contain' }} />
                ) : null}
                <View style={{ textAlign: 'right' }}>
                  <Text style={styles.continuedTitle}>
                    {isEnglish ? form.name_en : form.name_fr} {t.continued}
                  </Text>
                  <Text style={styles.continuedSubtitle}>
                    {t.submittedBy}: {response.submitted_by}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Page Content */}
          {renderPageContent(formPage, pageIndex, pageIndex === 0)}

          {/* Notes - only on last page */}
          {pageIndex === pages.length - 1 && response.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>{t.notes}</Text>
              <Text style={styles.notesContent}>{response.notes}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>
              {t.generatedOn} {format(new Date(), 'MMM d, yyyy HH:mm')}
            </Text>
            <Text>
              {t.page} {pageIndex + 1} {t.pageOf} {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
