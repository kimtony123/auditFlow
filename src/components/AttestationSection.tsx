import React from "react";
import { Card, Typography } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { config } from "../config";

const { Title, Text } = Typography;

interface AttestationSectionProps {
  runtimeMeasurement?: string;
  tlsFingerprint?: string;
  attestedBy?: string[];
}

const AttestationSection: React.FC<AttestationSectionProps> = ({
  runtimeMeasurement,
  attestedBy = [...config.defaultAttestedBy]
}) => {
  const formatLongString = (str: string, charsPerLine: number = 20) => {
    if (!str) return "No attestation data available";
    
    const chunks = [];
    for (let i = 0; i < str.length; i += charsPerLine) {
      chunks.push(str.slice(i, i + charsPerLine));
    }
    return chunks.join('\n');
  };

  return (
    <div style={{ width: 320, padding: 20, background: "rgba(255, 255, 255, 0.8)", borderRadius: 16, backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#1a1a1a", fontWeight: 600 }}>
          Attestation
        </Title>
        <CheckCircleFilled style={{ marginLeft: 8, fontSize: 20, color: "#52c41a" }} />
      </div>
      
      {/* Runtime Measurement Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 8, color: "#1a1a1a", fontWeight: 500 }}>
          Runtime Measurement
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12, color: "#666" }}>
          Received from the enclave.
        </Text>
        <Card 
          size="small" 
          style={{ 
            border: "1px solid #d9f7be", 
            borderRadius: 12,
            backgroundColor: "#f6ffed",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div style={{ 
            fontFamily: "monospace", 
            fontSize: 10, 
            color: "#333",
            wordBreak: "break-all",
            lineHeight: 1.3,
            padding: "8px 0",
            maxHeight: "120px",
            overflowY: "auto"
          }}>
            {formatLongString(runtimeMeasurement || "No attestation data available")}
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginTop: 8,
            gap: 8
          }}>
            <span style={{ fontSize: 14, color: "#999" }}>🔒</span>
            <span style={{ fontSize: 14, color: "#999" }}>+</span>
            <span style={{ fontSize: 14, color: "#999" }}>🖥️</span>
          </div>
        </Card>
      </div>

      {/* Runtime attested by Section */}
      <div>
        <Title level={5} style={{ 
          marginBottom: 12, 
          color: "#1a1a1a",
          backgroundColor: "rgba(24, 144, 255, 0.1)",
          padding: "6px 12px",
          borderRadius: 8,
          display: "inline-block",
          fontWeight: 500
        }}>
          Runtime attested by:
        </Title>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {attestedBy.map((company, index) => (
            <Card 
              key={index}
              size="small" 
              style={{ 
                width: 70, 
                height: 50, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                backgroundColor: "#fafafa",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#333" }}>{company}</Text>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttestationSection; 