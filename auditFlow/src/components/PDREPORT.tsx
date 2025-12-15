// components/PDFReport.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles inside component to avoid redeclaration
const createStyles = () => 
  StyleSheet.create({
    page: {
      padding: 30,
      backgroundColor: '#ffffff',
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      textAlign: 'center' as const,
      color: '#333333',
      fontWeight: 'bold' as const,
    },
    section: {
      marginBottom: 15,
      padding: 15,
      backgroundColor: '#f8f9fa',
      borderRadius: 5,
    },
    heading: {
      fontSize: 16,
      marginBottom: 10,
      color: '#2c3e50',
      fontWeight: 'bold' as const,
    },
    text: {
      fontSize: 12,
      marginBottom: 5,
      color: '#34495e',
      lineHeight: 1.5,
    },
    riskScore: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      marginTop: 10,
    },
    vulnerability: {
      marginBottom: 10,
      padding: 10,
      backgroundColor: '#fff3cd',
      borderRadius: 3,
    },
    highRisk: {
      color: '#dc3545',
    },
    mediumRisk: {
      color: '#ffc107',
    },
    lowRisk: {
      color: '#28a745',
    },
  });

interface PDFData {
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

interface AnalysisPDFProps {
  data: PDFData;
}

export const AnalysisPDF: React.FC<AnalysisPDFProps> = ({ data }) => {
  const styles = createStyles(); // Create styles instance
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Smart Contract AI Analysis Report</Text>
        
        <View style={styles.section}>
          <Text style={styles.heading}>Contract Details</Text>
          <Text style={styles.text}>Contract Name: {data.contractName}</Text>
          <Text style={styles.text}>Address: {data.contractAddress}</Text>
          <Text style={styles.text}>Analysis Date: {data.analysisDate}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.heading}>AI Analysis Summary</Text>
          <Text style={styles.text}>{data.aiSummary}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.heading}>Risk Assessment</Text>
          <Text style={[styles.text, styles.riskScore]}>
            Overall Risk Score: {data.riskScore}/10
          </Text>
          <Text style={styles.text}>
            {data.riskScore <= 3 ? 'Low Risk - Contract appears secure' :
             data.riskScore <= 7 ? 'Medium Risk - Some concerns identified' :
             'High Risk - Significant security issues found'}
          </Text>
        </View>
        
        {data.vulnerabilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Security Vulnerabilities</Text>
            {data.vulnerabilities.map((vuln, index) => (
              <View key={index} style={styles.vulnerability}>
                <Text style={[
                  styles.text,
                  vuln.severity === 'high' ? styles.highRisk :
                  vuln.severity === 'medium' ? styles.mediumRisk : styles.lowRisk
                ]}>
                  {index + 1}. {vuln.description}
                </Text>
                <Text style={styles.text}>Recommendation: {vuln.recommendation}</Text>
              </View>
            ))}
          </View>
        )}
        
        {data.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Key Recommendations</Text>
            {data.recommendations.map((rec, index) => (
              <Text key={index} style={styles.text}>
                • {rec}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};