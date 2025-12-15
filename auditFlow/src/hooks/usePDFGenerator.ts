// hooks/usePDFGenerator.ts - UPDATED
import { useState } from 'react';
import { generateComprehensivePDF, preparePdfData } from '../services/pdfGenerator';

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (analysisData: any) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (!analysisData) {
        throw new Error('No analysis data available');
      }

      // Parse the AI analysis
      const parsedData = parseAIAnalysis(analysisData.aiAnalysis);
      
      // Prepare comprehensive PDF data
      const pdfData = preparePdfData(analysisData, parsedData);
      
      // Generate comprehensive PDF
      await generateComprehensivePDF(pdfData);
      
      return true;
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to parse AI analysis
  const parseAIAnalysis = (aiAnalysisString: string): any => {
    try {
      const cleanJson = aiAnalysisString
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*{/, '{')
        .replace(/}\s*$/, '}')
        .trim();
      
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      return null;
    }
  };

  return {
    generateReport,
    isGenerating,
    error
  };
};