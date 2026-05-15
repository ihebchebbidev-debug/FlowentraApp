import { callForJson } from '@/services/aiKeyManager';

interface ColumnPrediction {
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  reasoning: string;
}

interface ColumnMappingPrediction {
  predictions: ColumnPrediction[];
  language: string;
  confidence: number;
  aiUsed: boolean;
}

export class AIColumnMapperService {
  private async callLLM(prompt: string): Promise<string> {
    const result = await callForJson<any>({
      system: 'You are FlowSolutio AI, an intelligent assistant for mapping Excel columns to contact fields. Respond only with valid JSON. Be concise and accurate.',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 1500,
    });

    if (result.success && result.data) {
      return JSON.stringify(result.data);
    }
    throw new Error(result.error || 'LLM call failed');
  }

  private detectLanguage(headers: string[], data: any[][]): 'en' | 'fr' | 'de' {
    const text = [...headers, ...data.flat()].join(' ').toLowerCase();
    
    // Language detection patterns
    const patterns = {
      fr: ['nom', 'prénom', 'email', 'téléphone', 'adresse', 'ville', 'pays', 'société', 'entreprise'],
      de: ['name', 'vorname', 'nachname', 'telefon', 'adresse', 'stadt', 'land', 'firma', 'unternehmen'],
      en: ['name', 'email', 'phone', 'address', 'city', 'country', 'company', 'organization']
    };

    const scores = {
      fr: patterns.fr.filter(word => text.includes(word)).length,
      de: patterns.de.filter(word => text.includes(word)).length,
      en: patterns.en.filter(word => text.includes(word)).length
    };

    // Return the language with the highest score
    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0] as 'en' | 'fr' | 'de';
  }

  private createPrompt(headers: string[], sampleData: any[][], language: 'en' | 'fr' | 'de'): string {
    const languageInstructions = {
      en: 'Analyze the following Excel headers and sample data in English',
      fr: 'Analysez les en-têtes Excel et les données d\'échantillon suivantes en français',
      de: 'Analysieren Sie die folgenden Excel-Überschriften und Beispieldaten auf Deutsch'
    };

    const targetFields = {
      en: {
        fullName: 'Full name or complete name',
        firstName: 'First name or given name',
        lastName: 'Last name or family name',
        companyName: 'Company name or organization',
        email: 'Email address',
        phone: 'Phone number or telephone',
        position: 'Job title or position',
        fullAddress: 'Complete address',
        address: 'Street address',
        city: 'City or locality',
        state: 'State or province',
        zipCode: 'ZIP code or postal code',
        country: 'Country',
        contactType: 'Contact type (Individual/Company)',
        notes: 'Notes or comments'
      },
      fr: {
        fullName: 'Nom complet',
        firstName: 'Prénom',
        lastName: 'Nom de famille',
        companyName: 'Nom de l\'entreprise',
        email: 'Adresse e-mail',
        phone: 'Numéro de téléphone',
        position: 'Poste ou fonction',
        fullAddress: 'Adresse complète',
        address: 'Adresse',
        city: 'Ville',
        state: 'État ou province',
        zipCode: 'Code postal',
        country: 'Pays',
        contactType: 'Type de contact',
        notes: 'Notes'
      },
      de: {
        fullName: 'Vollständiger Name',
        firstName: 'Vorname',
        lastName: 'Nachname',
        companyName: 'Firmenname',
        email: 'E-Mail-Adresse',
        phone: 'Telefonnummer',
        position: 'Position oder Titel',
        fullAddress: 'Vollständige Adresse',
        address: 'Adresse',
        city: 'Stadt',
        state: 'Staat oder Provinz',
        zipCode: 'Postleitzahl',
        country: 'Land',
        contactType: 'Kontakttyp',
        notes: 'Notizen'
      }
    };

    return `${languageInstructions[language]}.

Headers: ${JSON.stringify(headers)}
Sample Data (first 2 rows): ${JSON.stringify(sampleData.slice(0, 2))}

Available target fields:
${Object.entries(targetFields[language]).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

Analyze each header and predict which target field it should map to. Consider header names, sample data content, and language context (${language}).

Respond with ONLY valid JSON:
{
  "predictions": [
    {
      "sourceColumn": "header_name",
      "targetField": "field_key_or_null",
      "confidence": 0.95,
      "reasoning": "brief explanation"
    }
  ],
  "language": "${language}",
  "confidence": 0.85
}

If no good match exists for a header, set targetField to null.`;
  }

  private parseAIResponse(content: string): any {
    try {
      // First, try direct JSON parsing
      return JSON.parse(content);
    } catch (error) {
      // Try to extract JSON from response if wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          throw new Error('Invalid JSON structure in AI response');
        }
      }
      throw new Error('No valid JSON found in AI response');
    }
  }

  private createFallbackMapping(headers: string[]): ColumnPrediction[] {
    return headers.map(header => {
      const lowerHeader = header.toLowerCase().replace(/[*\s]/g, '');
      let targetField: string | null = null;
      let confidence = 0.6;

      // Enhanced keyword matching
      if (lowerHeader.includes('fullname') || (lowerHeader.includes('name') && !lowerHeader.includes('company'))) {
        targetField = 'fullName';
        confidence = 0.8;
      } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
        targetField = 'email';
        confidence = 0.9;
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('tel') || lowerHeader.includes('mobile')) {
        targetField = 'phone';
        confidence = 0.8;
      } else if (lowerHeader.includes('company') || lowerHeader.includes('organization') || lowerHeader.includes('société')) {
        targetField = 'companyName';
        confidence = 0.8;
      } else if (lowerHeader.includes('position') || lowerHeader.includes('title') || lowerHeader.includes('job') || lowerHeader.includes('poste')) {
        targetField = 'position';
        confidence = 0.7;
      } else if (lowerHeader.includes('address') || lowerHeader.includes('location') || lowerHeader.includes('adresse')) {
        targetField = 'fullAddress';
        confidence = 0.7;
      } else if (lowerHeader.includes('type') || lowerHeader.includes('category')) {
        targetField = 'contactType';
        confidence = 0.6;
      } else if (lowerHeader.includes('city') || lowerHeader.includes('ville')) {
        targetField = 'city';
        confidence = 0.8;
      } else if (lowerHeader.includes('firstname') || lowerHeader.includes('prénom') || lowerHeader.includes('vorname')) {
        targetField = 'firstName';
        confidence = 0.8;
      } else if (lowerHeader.includes('lastname') || lowerHeader.includes('surname') || lowerHeader.includes('nachname')) {
        targetField = 'lastName';
        confidence = 0.8;
      }

      return {
        sourceColumn: header,
        targetField,
        confidence,
        reasoning: 'Smart keyword matching'
      };
    });
  }

  async predictColumnMapping(
    headers: string[],
    sampleData: any[][],
    language?: 'en' | 'fr' | 'de',
    isTemplate?: boolean
  ): Promise<ColumnMappingPrediction> {
    const detectedLanguage = language || this.detectLanguage(headers, sampleData);
    
    // If it's our template, use direct mapping for optimal performance
    if (isTemplate) {
      console.log('📋 Template file detected - using optimized mapping');
      const templateMapping = this.getTemplateMapping(headers);
      if (templateMapping) {
        return {
          predictions: Object.entries(templateMapping).map(([sourceColumn, targetField]) => ({
            sourceColumn,
            targetField,
            confidence: 1.0,
            reasoning: 'Direct template mapping'
          })),
          language: detectedLanguage,
          confidence: 1.0,
          aiUsed: false
        };
      }
    }
    
    // Optimize sample size based on dataset size - smaller sample for faster processing
    const maxSampleSize = sampleData.length > 1000 ? 2 : 3;
    const aiSampleData = sampleData.slice(0, maxSampleSize);
    
    console.log(`⚡ Fast processing ${headers.length} headers with ${aiSampleData.length} sample rows`);
    
    // Try smart fallback first for faster results, then AI enhancement
    const fallbackPredictions = this.createFallbackMapping(headers);
    
    // Only use AI for uncertain mappings or when specifically needed
    const uncertainMappings = fallbackPredictions.filter(p => p.confidence < 0.7);
    
    if (uncertainMappings.length > 0 && headers.length <= 20) {
      try {
        console.log('🤖 FlowSolutio AI: Enhancing uncertain mappings...');
        
        // Only send uncertain headers to AI for faster processing
        const uncertainHeaders = uncertainMappings.map(p => p.sourceColumn);
        const prompt = this.createPrompt(uncertainHeaders, aiSampleData, detectedLanguage);
        
        // Set shorter timeout for faster response
        const response = await Promise.race([
          this.callLLM(prompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 3000))
        ]) as string;
        
        const aiResult = this.parseAIResponse(response);
        
        // Merge AI results with fallback predictions
        if (aiResult.predictions && Array.isArray(aiResult.predictions)) {
          aiResult.predictions.forEach(aiPred => {
            const fallbackIndex = fallbackPredictions.findIndex(f => f.sourceColumn === aiPred.sourceColumn);
            if (fallbackIndex !== -1 && aiPred.confidence > fallbackPredictions[fallbackIndex].confidence) {
              fallbackPredictions[fallbackIndex] = aiPred;
            }
          });
        }

        console.log('✅ FlowSolutio AI: Enhancement complete');
        
        return {
          predictions: fallbackPredictions,
          language: detectedLanguage,
          confidence: Math.max(0.8, aiResult.confidence || 0.8),
          aiUsed: true
        };
        
      } catch (error) {
        console.log('⚠️ FlowSolutio AI: Enhancement skipped, using smart mapping:', error.message);
      }
    }
    
    return {
      predictions: fallbackPredictions,
      language: detectedLanguage,
      confidence: 0.7,
      aiUsed: false
    };
  }

  private getTemplateMapping(headers: string[]): Record<string, string> | null {
    const templateHeaders = ['Full Name*', 'Email Address*', 'Phone Number', 'Contact Type (Individual / Company)', 'Position / Title', 'Full Address'];
    const fieldMap: Record<string, string> = {
      'Full Name*': 'fullName',
      'Email Address*': 'email',
      'Phone Number': 'phone',
      'Contact Type (Individual / Company)': 'contactType',
      'Position / Title': 'position',
      'Full Address': 'fullAddress'
    };

    // Check if headers match our template structure
    const matchingHeaders = headers.filter(header => templateHeaders.includes(header));
    
    if (matchingHeaders.length >= 4) { // At least 4 template headers found
      const mapping: Record<string, string> = {};
      headers.forEach(header => {
        if (fieldMap[header]) {
          mapping[header] = fieldMap[header];
        }
      });
      return mapping;
    }
    
    return null;
  }
}

export const aiColumnMapper = new AIColumnMapperService();