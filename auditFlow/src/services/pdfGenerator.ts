// services/pdfGenerator.ts - FIXED VERSION
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Extend jsPDF with autoTable


// Declare autoTable function
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

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
  detailedAnalysis?: string;
  executiveSummary?: string;
  riskLevel?: string;
}

/**
 * Generate comprehensive PDF report with ALL AI data (NO AUTO-TABLE VERSION)
 */
export const generateComprehensivePDF = async (data: PDFData): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4') 
  const margin = 20;
  let yPos = margin;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Set document properties
  pdf.setProperties({
    title: `Smart Contract Audit - ${data.contractAddress}`,
    subject: 'Smart Contract Security Analysis Report',
    author: 'AI Security Auditor',
    keywords: 'smart contract, security, audit, blockchain, vulnerabilities',
    creator: 'Smart Contract AI Analyzer'
  });
  
  // Add header with colored box
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text('SMART CONTRACT AUDIT REPORT', pageWidth / 2, 18, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text('AI-Powered Security Analysis', pageWidth / 2, 25, { align: 'center' });
  
  yPos = 40;
  pdf.setTextColor(33, 33, 33);
  
  // CONTRACT INFORMATION SECTION
  pdf.setFontSize(16);
  pdf.text('Contract Information', margin, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  const contractInfo = [
    [`Contract Name:`, data.contractName],
    [`Address:`, data.contractAddress],
    [`Analysis Date:`, data.analysisDate],
    [`Risk Level:`, data.riskLevel?.toUpperCase() || 'Unknown'],
    [`Risk Score:`, `${data.riskScore}/10`]
  ];
  
  contractInfo.forEach(([label, value]) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value.toString(), margin + 40, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  
  // EXECUTIVE SUMMARY SECTION
  const execSummary = data.executiveSummary || data.aiSummary;
  if (execSummary) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Executive Summary', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setTextColor(33, 33, 33);
    const summaryLines = pdf.splitTextToSize(execSummary, pageWidth - margin * 2);
    pdf.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 10;
  }
  
  // DETAILED ANALYSIS SECTION
  if (data.detailedAnalysis) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Detailed Analysis', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setTextColor(33, 33, 33);
    const detailedLines = pdf.splitTextToSize(data.detailedAnalysis, pageWidth - margin * 2);
    pdf.text(detailedLines, margin, yPos);
    yPos += detailedLines.length * 5 + 10;
  }
  
  // VULNERABILITIES SECTION - MANUAL TABLE WITHOUT AUTO-TABLE
  if (data.vulnerabilities && data.vulnerabilities.length > 0) {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Security Vulnerabilities', margin, yPos);
    yPos += 10;
    
    // Group vulnerabilities by severity
    const highVulns = data.vulnerabilities.filter(v => v.severity === 'high');
    const mediumVulns = data.vulnerabilities.filter(v => v.severity === 'medium');
    const lowVulns = data.vulnerabilities.filter(v => v.severity === 'low');
    
    // Severity summary
    pdf.setFontSize(12);
    pdf.setTextColor(66, 66, 66);
    pdf.text(`High Risk: ${highVulns.length} | Medium Risk: ${mediumVulns.length} | Low Risk: ${lowVulns.length}`, margin, yPos);
    yPos += 10;
    
    // Draw table header manually
    pdf.setFillColor(41, 128, 185);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('#', margin + 5, yPos + 6);
    pdf.text('Severity', margin + 20, yPos + 6);
    pdf.text('Description', margin + 60, yPos + 6);
    pdf.text('Recommendation', margin + 140, yPos + 6);
    yPos += 12;
    
    // Draw table rows
    data.vulnerabilities.forEach((vuln, index) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
        // Redraw header on new page
        pdf.setFillColor(41, 128, 185);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('#', margin + 5, yPos + 6);
        pdf.text('Severity', margin + 20, yPos + 6);
        pdf.text('Description', margin + 60, yPos + 6);
        pdf.text('Recommendation', margin + 140, yPos + 6);
        yPos += 12;
      }
      
      // Alternate row colors
      const fillColor = index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
      pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      pdf.rect(margin, yPos - 2, pageWidth - margin * 2, 25, 'F');
      
      // Row content
      pdf.setFontSize(9);
      pdf.setTextColor(33, 33, 33);
      pdf.setFont('helvetica', 'normal');
      
      // Row number
      pdf.text((index + 1).toString(), margin + 5, yPos + 5);
      
      // Severity with color
      const severityColor = vuln.severity === 'high' ? [211, 47, 47] :
                           vuln.severity === 'medium' ? [245, 124, 0] : [56, 142, 60];
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(vuln.severity.toUpperCase(), margin + 20, yPos + 5);
      
      // Description
      pdf.setTextColor(66, 66, 66);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(vuln.description.substring(0, 100) + (vuln.description.length > 100 ? '...' : ''), 70);
      pdf.text(descLines, margin + 60, yPos + 5);
      
      // Recommendation
      const recLines = pdf.splitTextToSize(vuln.recommendation.substring(0, 80) + (vuln.recommendation.length > 80 ? '...' : ''), 60);
      pdf.text(recLines, margin + 140, yPos + 5);
      
      yPos += Math.max(descLines.length, recLines.length) * 5 + 10;
    });
    
    yPos += 10;
  } else {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Security Assessment', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setTextColor(76, 175, 80);
    pdf.text('✅ No vulnerabilities detected. The contract appears secure.', margin, yPos);
    yPos += 10;
  }
  
  // GAS OPTIMIZATIONS SECTION
  if (data.gasOptimizations && data.gasOptimizations.length > 0) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Gas Optimization Opportunities', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setTextColor(66, 66, 66);
    
    data.gasOptimizations.forEach((optimization, index) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = margin;
        // Re-add heading on new page
        pdf.setFontSize(16);
        pdf.setTextColor(41, 128, 185);
        pdf.text('Gas Optimization Opportunities (continued)', margin, yPos);
        yPos += 10;
        pdf.setFontSize(11);
        pdf.setTextColor(66, 66, 66);
      }
      
      // Add lightning bolt icon
      pdf.setFontSize(12);
      pdf.setTextColor(255, 193, 7);
      pdf.text('⚡', margin, yPos);
      pdf.setFontSize(11);
      pdf.setTextColor(66, 66, 66);
      
      const optLines = pdf.splitTextToSize(`${index + 1}. ${optimization}`, pageWidth - margin * 2 - 10);
      pdf.text(optLines, margin + 10, yPos);
      yPos += optLines.length * 5 + 5;
    });
    
    yPos += 5;
  }
  
  // BEST PRACTICES SECTION
  if (data.bestPractices && data.bestPractices.length > 0) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Best Practices Compliance', margin, yPos);
    yPos += 10;
    
    // Calculate compliance stats
    const compliantCount = data.bestPractices.filter(p => p.compliant).length;
    const totalCount = data.bestPractices.length;
    const compliancePercent = Math.round((compliantCount / totalCount) * 100);
    
    pdf.setFontSize(11);
    pdf.setTextColor(66, 66, 66);
    pdf.text(`Compliance: ${compliantCount}/${totalCount} (${compliancePercent}%)`, margin, yPos);
    yPos += 10;
    
    data.bestPractices.forEach((practice, index) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      
      const status = practice.compliant ? '✅' : '❌';
      const statusColor = practice.compliant ? [76, 175, 80] : [244, 67, 54];
      
      pdf.setFontSize(14);
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(status, margin, yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 33, 33);
      pdf.setFontSize(11);
      pdf.text(`${index + 1}. ${practice.check}`, margin + 10, yPos);
      
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 66, 66);
      const detailLines = pdf.splitTextToSize(practice.details, pageWidth - margin * 2 - 15);
      pdf.text(detailLines, margin + 10, yPos);
      yPos += detailLines.length * 5 + 10;
    });
  }
  
  // RECOMMENDATIONS SECTION
  if (data.recommendations && data.recommendations.length > 0) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('Recommendations & Next Steps', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setTextColor(66, 66, 66);
    
    data.recommendations.forEach((recommendation, index) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = margin;
        // Re-add heading on new page
        pdf.setFontSize(16);
        pdf.setTextColor(41, 128, 185);
        pdf.text('Recommendations & Next Steps (continued)', margin, yPos);
        yPos += 10;
        pdf.setFontSize(11);
        pdf.setTextColor(66, 66, 66);
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}.`, margin, yPos);
      
      pdf.setFont('helvetica', 'normal');
      const recLines = pdf.splitTextToSize(recommendation, pageWidth - margin * 2 - 10);
      pdf.text(recLines, margin + 10, yPos);
      yPos += recLines.length * 5 + 5;
    });
  }
  
  // Add footer to all pages
  const totalPages = pdf.internal.pages.length;

  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    
    // Page number
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Confidential footer
    pdf.text(
      'Confidential - For authorized use only • Generated by AI Security Auditor',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
    
    // Add watermark on all pages
    pdf.setFontSize(60);
    pdf.setTextColor(240, 240, 240);
    pdf.setTextColor(220, 220, 220);
    pdf.text(
      'AI AUDIT',
      pageWidth / 2,
      pageHeight / 2,
      { align: 'center', angle: 45 }
    );
  }
  
  // Save PDF with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`smart-contract-audit-${data.contractAddress.substring(0, 8)}-${timestamp}.pdf`);
};

/**
 * Alternative: Generate PDF without autoTable (using manual table)
 */
export const generatePDFDirectly = async (data: PDFData): Promise<void> => {
  return generateComprehensivePDF(data);
};

/**
 * Generate PDF using HTML2Canvas (alternative method)
 */
export const generateAnalysisPDF = async (
  data: PDFData,
  elementId: string = 'analysis-report'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Report element not found');
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions
    const imgWidth = 190; // mm (A4 width minus margins)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add the image
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`contract-audit-${data.contractAddress.substring(0, 8)}-${timestamp}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF via HTML:', error);
    // Fallback to direct PDF generation
    await generatePDFDirectly(data);
  }
};

/**
 * Create detailed HTML content for PDF (for HTML2Canvas method)
 */
export const createReportHTML = (data: PDFData): string => {
  // Use the existing createDetailedReportHTML function
  return createDetailedReportHTML(data);
};

/**
 * Create detailed HTML content for PDF
 */
export const createDetailedReportHTML = (data: PDFData): string => {
  return `
    <div id="analysis-report" style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2c3e50, #3498db); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 32px; text-align: center;">Smart Contract AI Audit Report</h1>
        <p style="color: rgba(255,255,255,0.9); text-align: center; margin-top: 10px;">Comprehensive Security Analysis</p>
      </div>
      
      <!-- Contract Info -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3498db;">
        <h2 style="color: #2c3e50; margin-top: 0;">Contract Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Contract Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${data.contractName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Address:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><code>${data.contractAddress}</code></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Analysis Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${data.analysisDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Risk Level:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <span style="
                padding: 4px 12px;
                border-radius: 20px;
                font-weight: bold;
                background: ${
                  data.riskLevel === 'high' ? '#e74c3c' :
                  data.riskLevel === 'medium' ? '#f39c12' : '#27ae60'
                };
                color: white;
              ">
                ${data.riskLevel?.toUpperCase() || 'UNKNOWN'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Risk Score:</strong></td>
            <td style="padding: 8px 0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px; font-weight: bold; color: ${
                  data.riskScore <= 3 ? '#27ae60' : 
                  data.riskScore <= 7 ? '#f39c12' : '#e74c3c'
                };">
                  ${data.riskScore}/10
                </div>
                <div style="flex-grow: 1;">
                  <div style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="
                      width: ${(data.riskScore / 10) * 100}%;
                      height: 100%;
                      background: ${
                        data.riskScore <= 3 ? '#27ae60' : 
                        data.riskScore <= 7 ? '#f39c12' : '#e74c3c'
                      };
                    "></div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Executive Summary -->
      ${data.executiveSummary ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Executive Summary</h2>
        <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e0e0e0; line-height: 1.6;">
          ${data.executiveSummary.replace(/\n/g, '<br>')}
        </div>
      </div>
      ` : ''}
      
      <!-- Detailed Analysis -->
      ${data.detailedAnalysis ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Detailed Analysis</h2>
        <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e0e0e0; line-height: 1.6;">
          ${data.detailedAnalysis.replace(/\n/g, '<br>')}
        </div>
      </div>
      ` : ''}
      
      <!-- Vulnerabilities -->
      ${data.vulnerabilities && data.vulnerabilities.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Security Vulnerabilities (${data.vulnerabilities.length} found)
        </h2>
        
        <!-- Severity Summary -->
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
          <div style="flex: 1; text-align: center; padding: 10px; background: #fdecea; border-radius: 5px;">
            <div style="font-size: 24px; color: #d32f2f; font-weight: bold;">
              ${data.vulnerabilities.filter(v => v.severity === 'high').length}
            </div>
            <div style="color: #d32f2f; font-weight: bold;">High Risk</div>
          </div>
          <div style="flex: 1; text-align: center; padding: 10px; background: #fff4e5; border-radius: 5px;">
            <div style="font-size: 24px; color: #f57c00; font-weight: bold;">
              ${data.vulnerabilities.filter(v => v.severity === 'medium').length}
            </div>
            <div style="color: #f57c00; font-weight: bold;">Medium Risk</div>
          </div>
          <div style="flex: 1; text-align: center; padding: 10px; background: #e8f5e9; border-radius: 5px;">
            <div style="font-size: 24px; color: #388e3c; font-weight: bold;">
              ${data.vulnerabilities.filter(v => v.severity === 'low').length}
            </div>
            <div style="color: #388e3c; font-weight: bold;">Low Risk</div>
          </div>
        </div>
        
        <!-- Vulnerabilities Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #2980b9; color: white;">
              <th style="padding: 12px; text-align: left; width: 50px;">#</th>
              <th style="padding: 12px; text-align: left; width: 100px;">Severity</th>
              <th style="padding: 12px; text-align: left;">Description</th>
              <th style="padding: 12px; text-align: left;">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${data.vulnerabilities.map((vuln, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                  <span style="
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    background: ${
                      vuln.severity === 'high' ? '#ffebee' :
                      vuln.severity === 'medium' ? '#fff3e0' : '#e8f5e9'
                    };
                    color: ${
                      vuln.severity === 'high' ? '#d32f2f' :
                      vuln.severity === 'medium' ? '#f57c00' : '#388e3c'
                    };
                  ">
                    ${vuln.severity.toUpperCase()}
                  </span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${vuln.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${vuln.recommendation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div style="margin-bottom: 30px; text-align: center; padding: 40px 20px; background: #e8f5e9; border-radius: 10px;">
        <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
        <h3 style="color: #2e7d32; margin-bottom: 10px;">No Vulnerabilities Detected</h3>
        <p style="color: #666;">The AI analysis did not find any security vulnerabilities in this contract.</p>
      </div>
      `}
      
      <!-- Gas Optimizations -->
      ${data.gasOptimizations && data.gasOptimizations.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Gas Optimization Opportunities (${data.gasOptimizations.length})
        </h2>
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
          <ul style="margin: 0; padding-left: 20px;">
            ${data.gasOptimizations.map(opt => `
              <li style="margin-bottom: 10px; color: #1976d2; line-height: 1.5;">
                <span style="color: #2196f3; margin-right: 10px;">⚡</span>${opt}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      ` : ''}
      
      <!-- Best Practices -->
      ${data.bestPractices && data.bestPractices.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Best Practices Compliance
        </h2>
        
        <!-- Compliance Stats -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <div>
            <div style="font-size: 32px; font-weight: bold; color: #2c3e50;">
              ${data.bestPractices.filter(p => p.compliant).length}/${data.bestPractices.length}
            </div>
            <div style="color: #666;">Best Practices Met</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: #4caf50;">
              ${Math.round((data.bestPractices.filter(p => p.compliant).length / data.bestPractices.length) * 100)}%
            </div>
            <div style="color: #666;">Compliance Rate</div>
          </div>
        </div>
        
        <!-- Practices List -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px;">
          ${data.bestPractices.map(practice => `
            <div style="
              padding: 15px;
              background: white;
              border-radius: 8px;
              border: 1px solid ${practice.compliant ? '#c8e6c9' : '#ffcdd2'};
              border-left: 4px solid ${practice.compliant ? '#4caf50' : '#f44336'};
            ">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 20px; color: ${practice.compliant ? '#4caf50' : '#f44336'}">
                  ${practice.compliant ? '✅' : '❌'}
                </span>
                <strong style="color: #2c3e50;">${practice.check}</strong>
              </div>
              <div style="color: #666; line-height: 1.5;">${practice.details}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Recommendations -->
      ${data.recommendations && data.recommendations.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Recommendations & Next Steps
        </h2>
        <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <ol style="margin: 0; padding-left: 20px;">
            ${data.recommendations.map(rec => `
              <li style="margin-bottom: 10px; color: #333; line-height: 1.5;">
                ${rec}
              </li>
            `).join('')}
          </ol>
        </div>
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666; font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <strong>Generated by:</strong> AI Smart Contract Security Auditor<br>
            <strong>Date:</strong> ${new Date().toLocaleString()}
          </div>
          <div style="text-align: right;">
            <strong>Report ID:</strong> ${Math.random().toString(36).substr(2, 9).toUpperCase()}<br>
            <strong>Page:</strong> 1 of 1
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999;">
          <em>This report is for informational purposes only. For critical contracts, additional manual review is recommended.</em>
        </div>
      </div>
    </div>
  `;
};

/**
 * Prepare PDF data from backend response
 */
export const preparePdfData = (analysisData: any, parsedData: any): PDFData => {
  return {
    contractAddress: analysisData.contractAddress,
    contractName: analysisData.contractName || 'Unknown Contract',
    analysisDate: new Date(analysisData.timestamp).toLocaleDateString(),
    aiSummary: parsedData?.executiveSummary || 'No summary available',
    detailedAnalysis: parsedData?.detailedAnalysis,
    executiveSummary: parsedData?.executiveSummary,
    riskLevel: parsedData?.riskLevel || analysisData.riskLevel,
    
    vulnerabilities: parsedData?.vulnerabilities?.map((v: any) => ({
      severity: v.severity,
      description: `${v.title}: ${v.description}`,
      recommendation: v.recommendation
    })) || [],
    
    gasOptimizations: parsedData?.gasOptimizations || [],
    bestPractices: parsedData?.bestPractices || [],
    
    riskScore: parsedData?.riskScore ? Math.round(parsedData.riskScore / 10) : 
               (analysisData.auditScore ? Math.floor(analysisData.auditScore / 10) : 5),
    
    recommendations: parsedData?.recommendations || []
  };
};