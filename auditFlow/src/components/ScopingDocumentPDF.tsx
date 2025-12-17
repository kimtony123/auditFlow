// components/pdf/ScopingDocumentPDF.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

interface ScopingDocumentPDFProps {
  data: {
    basicInfo: any;
    codeDetails: any;
    protocolDetails: any;
    protocolRisks: any;
    knownIssues: any[];
    previousAudits: any;
    resources: any;
    rektTest: any;
    postDeployment: any;
    generatedAt: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#0066ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066ff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#444',
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    minHeight: 30,
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  value: {
    marginBottom: 10,
    color: '#333',
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 5,
  },
  checked: {
    backgroundColor: '#0066ff',
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    marginBottom: 5,
    flexDirection: 'row',
  },
  bullet: {
    width: 10,
    marginRight: 5,
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    fontFamily: 'Courier',
    fontSize: 9,
    marginVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
});

const ScopingDocumentPDF: React.FC<ScopingDocumentPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderCheckbox = (checked: boolean) => (
    <View style={[styles.checkbox, checked && styles.checked]} />
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Protocol Security Review Scoping Document</Text>
          <Text style={styles.subtitle}>
            Generated: {formatDate(data.generatedAt)} | Protocol: {data.basicInfo.protocolName || 'Unnamed Protocol'}
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Basic Information</Text>
          
          <View style={styles.table}>
            {/* Table Headers */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCell}>
                <Text>Field</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>Value</Text>
              </View>
            </View>
            
            {/* Table Rows */}
            {[
              ['Protocol Name', data.basicInfo.protocolName],
              ['Website', data.basicInfo.website],
              ['Documentation', data.basicInfo.documentationLink],
              ['Contact', `${data.basicInfo.contactName} (${data.basicInfo.contactEmail})`],
              ['Telegram', data.basicInfo.contactTelegram],
              ['Whitepaper', data.basicInfo.whitepaperLink],
            ].map(([label, value], index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>{label}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellLast]}>
                  <Text>{value || 'Not provided'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Code Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Code Details</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCell}>
                <Text>Field</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>Value</Text>
              </View>
            </View>
            
            {[
              ['Repository Link', data.codeDetails.repoLink],
              ['Commit Hash', data.codeDetails.commitHash],
              ['Number of Contracts', data.codeDetails.numberOfContracts],
              ['Total SLOC', data.codeDetails.totalSLOC],
              ['Complexity Score', data.codeDetails.complexityScore],
              ['External Protocols', data.codeDetails.externalProtocols],
              ['Test Coverage', data.codeDetails.testCoverage],
            ].map(([label, value], index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>{label}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellLast]}>
                  <Text>{value || 'Not provided'}</Text>
                </View>
              </View>
            ))}
          </View>

          {data.codeDetails.inScopeContracts && (
            <View style={{ marginTop: 15 }}>
              <Text style={styles.subsectionTitle}>In Scope Contracts:</Text>
              <View style={styles.codeBlock}>
                <Text>{data.codeDetails.inScopeContracts}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Protocol Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Protocol Details</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCell}>
                <Text>Question</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>Answer</Text>
              </View>
            </View>
            
            {[
              ['Current Status', data.protocolDetails.currentStatus],
              ['Is Fork?', data.protocolDetails.isFork ? 'Yes' : 'No'],
              ['Fork Protocol', data.protocolDetails.forkProtocol],
              ['Uses Rollups?', data.protocolDetails.usesRollups ? 'Yes' : 'No'],
              ['Multi-chain?', data.protocolDetails.multiChain ? 'Yes' : 'No'],
              ['Chains', data.protocolDetails.chains],
              ['Uses Oracles?', data.protocolDetails.usesOracles ? 'Yes' : 'No'],
              ['Uses AMMs?', data.protocolDetails.usesAMMs ? 'Yes' : 'No'],
              ['Uses ZK Proofs?', data.protocolDetails.usesZKProofs ? 'Yes' : 'No'],
              ['ERC20 Tokens', data.protocolDetails.erc20Tokens],
              ['ERC721 Tokens', data.protocolDetails.erc721Tokens],
              ['ERC777 Tokens?', data.protocolDetails.erc777Tokens ? 'Yes' : 'No'],
              ['Off-chain Processes?', data.protocolDetails.offChainProcesses ? 'Yes' : 'No'],
            ].map(([label, value], index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>{label}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellLast]}>
                  <Text>{value || 'Not provided'}</Text>
                </View>
              </View>
            ))}
          </View>

          {data.protocolDetails.offChainProcessesExplanation && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Off-chain Processes Explanation:</Text>
              <Text style={styles.value}>{data.protocolDetails.offChainProcessesExplanation}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AuditFlow Security Scoping Tool • Page 1 of 2 • Confidential</Text>
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        {/* Protocol Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Protocol Risks</Text>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.label}>Risks to Evaluate:</Text>
            <View style={styles.list}>
              {[
                { label: 'Centralization risks', value: data.protocolRisks.evaluateCentralizationRisks },
                { label: 'Admin risks', value: data.protocolRisks.evaluateAdminRisks },
                { label: 'Token inflation/deflation risks', value: data.protocolRisks.evaluateTokenInflationRisks },
                { label: 'Fee-on-transfer token risks', value: data.protocolRisks.evaluateFeeOnTransferRisks },
                { label: 'Rebasing token risks', value: data.protocolRisks.evaluateRebasingTokenRisks },
                { label: 'External contract pausing risks', value: data.protocolRisks.evaluateExternalPausingRisks },
                { label: 'Oracle risks', value: data.protocolRisks.evaluateOracleRisks },
                { label: 'Blacklist risks', value: data.protocolRisks.evaluateBlacklistRisks },
              ].map((item, index) => (
                <View key={index} style={styles.listItem}>
                  {renderCheckbox(item.value)}
                  <Text>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {data.protocolRisks.complyWithEIPs && (
            <View>
              <Text style={styles.label}>EIPs to Comply With:</Text>
              <Text style={styles.value}>{data.protocolRisks.eipsList}</Text>
            </View>
          )}
        </View>

        {/* Known Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Known Issues</Text>
          
          {data.knownIssues.filter(issue => issue.description.trim()).length > 0 ? (
            <View style={styles.list}>
              {data.knownIssues
                .filter(issue => issue.description.trim())
                .map((issue, index) => (
                  <View key={issue.id} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text>Issue {index + 1}: {issue.description}</Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>No known issues reported</Text>
          )}
        </View>

        {/* Previous Audits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Previous Audits</Text>
          
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Number of Previous Audits:</Text>
            <Text style={styles.value}>{data.previousAudits.count || 'None'}</Text>
          </View>
          
          {data.previousAudits.reportLinks && (
            <View>
              <Text style={styles.label}>Audit Report Links:</Text>
              <View style={styles.codeBlock}>
                <Text>{data.previousAudits.reportLinks}</Text>
              </View>
            </View>
          )}
        </View>

        {/* The Rekt Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. The Rekt Test</Text>
          
          <View style={styles.list}>
            {[
              'All actors, roles, and privileges documented',
              'Documentation of external services, contracts, and oracles',
              'Written and tested incident response plan',
              'Documentation of attack vectors',
              'Identity verification and background checks',
              'Team member with security role',
              'Hardware security keys for production',
              'Multi-person key management',
              'Key invariants defined and tested',
              'Automated security tools',
              'External audits and bug bounty program',
              'User abuse avenues considered and mitigated',
            ].map((question, index) => (
              <View key={index} style={styles.listItem}>
                {renderCheckbox(data.rektTest[`q${index + 1}` as keyof typeof data.rektTest])}
                <Text>{index + 1}. {question}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Post Deployment Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Post Deployment Planning</Text>
          
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Bug Bounty Program:</Text>
            <Text style={styles.value}>{data.postDeployment.bugBountyProgram || 'Not specified'}</Text>
          </View>
          
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Monitoring Solution:</Text>
            <Text style={styles.value}>{data.postDeployment.monitoringSolution || 'Not specified'}</Text>
          </View>
          
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Incident Response Team:</Text>
            <Text style={styles.value}>{data.postDeployment.incidentResponseTeam || 'Not specified'}</Text>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Resources</Text>
          
          {data.resources.flowCharts && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>Flow Charts / Design Docs:</Text>
              <View style={styles.codeBlock}>
                <Text>{data.resources.flowCharts}</Text>
              </View>
            </View>
          )}
          
          {data.resources.explainerVideos && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>Explainer Videos:</Text>
              <View style={styles.codeBlock}>
                <Text>{data.resources.explainerVideos}</Text>
              </View>
            </View>
          )}
          
          {data.resources.articles && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>Articles / Blogs:</Text>
              <View style={styles.codeBlock}>
                <Text>{data.resources.articles}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AuditFlow Security Scoping Tool • Page 2 of 2 • Confidential</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ScopingDocumentPDF;