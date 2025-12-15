// utils/dataParser.ts
export interface PDFData {
  contractAddress: string;
  contractName: string;
  analysisDate: string;
  aiSummary: string;
  vulnerabilities: Array<{
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }>;
  gasOptimizations: string[];
  bestPractices: Array<{
    compliant: boolean;
    check: string;
    details: string;
  }>;
  riskScore: number;
  recommendations: string[];
}

export interface BackendResponse {
  contractAddress: string;
  contractName: string;
  aiAnalysis: string; // This contains the JSON we need
  structuredReport: any;
  timestamp: string;
  vulnerabilityCounts: any;
  // ... other fields
}

export const parseAnalysisResponse = (response: BackendResponse): PDFData => {
  try {
    // Extract JSON from the aiAnalysis string (removing markdown code blocks)
    let parsedData;
    
    if (response.aiAnalysis) {
      // Remove the ```json markers and parse
      const jsonMatch = response.aiAnalysis.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        // Parse the JSON from the code block
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the entire aiAnalysis as JSON
        parsedData = JSON.parse(response.aiAnalysis);
      }
    } else {
      // Fallback to structuredReport
      parsedData = response.structuredReport;
    }

    // Transform to match PDFData interface
    const pdfData: PDFData = {
      contractAddress: response.contractAddress,
      contractName: response.contractName,
      analysisDate: new Date(response.timestamp).toLocaleDateString(),
      
      // Use parsed data or fallbacks
      aiSummary: parsedData?.executiveSummary || 
                 parsedData?.detailedAnalysis || 
                 "No summary available",
      
      vulnerabilities: parsedData?.vulnerabilities?.map((vuln: any) => ({
        severity: vuln.severity?.toLowerCase() as 'high' | 'medium' | 'low' || 'low',
        description: vuln.description || vuln.title || 'Unknown vulnerability',
        recommendation: vuln.recommendation || 'No specific recommendation provided'
      })) || [],
      
      gasOptimizations: parsedData?.gasOptimizations || [],
      
      bestPractices: parsedData?.bestPractices?.map((practice: any) => ({
        compliant: practice.compliant || false,
        check: practice.check || 'Unknown check',
        details: practice.details || 'No details provided'
      })) || [],
      
      // Convert riskScore (0-100) to 0-10 scale for PDF
      riskScore: Math.round((parsedData?.riskScore || 50) / 10),
      
      recommendations: parsedData?.recommendations || []
    };

    return pdfData;
  } catch (error) {
    console.error('Error parsing analysis response:', error);
    
    // Return minimal data if parsing fails
    return {
      contractAddress: response.contractAddress,
      contractName: response.contractName,
      analysisDate: new Date(response.timestamp).toLocaleDateString(),
      aiSummary: "Error parsing analysis data. Please try again.",
      vulnerabilities: [],
      gasOptimizations: [],
      bestPractices: [],
      riskScore: 5, // Middle risk
      recommendations: ["Unable to parse analysis results"]
    };
  }
};