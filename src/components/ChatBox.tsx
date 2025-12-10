import React, { useState, useRef, useEffect } from "react";
import { Input, Button, message as antdMessage } from "antd";
import { useWallet } from "../contexts/WalletContext";
import { message as aoMessage, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import { config } from "../config";

interface ChatItem {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

interface AttestationInfo {
  runtimeMeasurement: string;
  tlsFingerprint: string;
  attestedBy: string[];
}

interface ChatBoxProps {
  onAttestationUpdate?: (attestation: AttestationInfo) => void;
}

const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "Hi, I’m Apus Assistant! Ask me anything below — let’s get started!",
    timestamp: Date.now(),
  },
];

const processId = config.aoProcessId;
const apusHyperbeamNodeUrl = config.apusHyperbeamNodeUrl;

const payApusToken = async () => {
  // TODO: Call backend/contract to pay 1 Apus Token
  return Promise.resolve();
};

// use aoconnect's result to wait for message processing to complete
const pollForResult = async (reference: string): Promise<{ data: string; attestation?: any; reference?: string; status?: string }> => {
  try {
    const res = await dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'GetInferResponse' },
        { name: 'X-Reference', value: reference },
      ],
    });

    const raw = res?.Messages?.[0]?.Data;
    let parsed: any;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      parsed = raw;
    }

    // handle different structures: parse status and response first (response is a JSON string)
    const status = parsed?.status ?? 'success';
    if (status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 20000));
      return pollForResult(reference);
    }
    if (status === 'failed') {
      const msg = parsed?.error_message || 'Task failed';
      throw new Error(msg);
    }

    // parse inner response
    let inner: any = undefined;
    try {
      inner = parsed?.response
        ? (typeof parsed.response === 'string' ? JSON.parse(parsed.response) : parsed.response)
        : undefined;
    } catch {
      inner = undefined;
    }

    const resultText = (inner?.result ?? inner?.data ?? inner)
      ?? (parsed?.result ?? parsed?.data)
      ?? (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));

    const attestation = inner?.attestation ?? parsed?.attestation;
    const resolvedRef = parsed?.reference ?? reference;

    return {
      data: typeof resultText === 'string' ? resultText : JSON.stringify(resultText),
      attestation,
      reference: resolvedRef,
      status: 'success',
    };
  } catch (error) {
    throw new Error('Failed to get result: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const ChatBox: React.FC<ChatBoxProps> = ({ onAttestationUpdate }) => {
  const { checkLogin } = useWallet();
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(DEFAULT_CHAT);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestReference, setRequestReference] = useState<string>('');
  const chatListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!checkLogin()) return;
    if (!prompt.trim()) {
      antdMessage.warning("Please enter a message");
      return;
    }
    
    setLoading(true);
    try {
      await payApusToken();
      
      // Unique reference for UX display (not required for aoconnect)
      const ref = Date.now().toString();
      setRequestReference(ref);
      
      setChatHistory((prev) => [
        ...prev,
        { role: "user", message: prompt, timestamp: Date.now() },
        { role: "tip", message: "Your question is sent. Please wait for the answer...", timestamp: Date.now() },
      ]);
      
      const currentPrompt = prompt;
      setPrompt("");

      // use browser wallet signer
      const signer = createDataItemSigner((window as any).arweaveWallet);

      // send request to AO process via aoconnect.message
      const mid = await aoMessage({
        process: processId,
        tags: [
          { name: 'Action', value: 'Infer' },
          { name: 'X-Reference', value: ref },
        ],
        data: currentPrompt,
        signer,
      });

      // use dryrun to query inference result by reference
      const aiReply = await pollForResult(ref);
      
      // Update chat history with AI response
      setChatHistory((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", message: aiReply.data || String(aiReply), timestamp: Date.now() }
      ]);

      // Update attestation if available
      if (aiReply.attestation) {
        // handle complex attestation structure
        let attestationData = aiReply.attestation;
        let attestationJWT = '';
        
        if (Array.isArray(attestationData) && attestationData.length > 0) {
          for (const item of attestationData) {
            if (Array.isArray(item) && item.length === 2 && item[0] === 'JWT') {
              attestationJWT = item[1];
              break;
            }
          }
        }
        
        const newAttestation = {
          runtimeMeasurement: attestationJWT || JSON.stringify(attestationData),
          tlsFingerprint: aiReply.reference || "N/A",
          attestedBy: [...config.defaultAttestedBy]
        };
        onAttestationUpdate?.(newAttestation);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send message";
      antdMessage.error(errorMessage);
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      width: 600, 
      background: "rgba(255, 255, 255, 0.9)", 
      borderRadius: 20, 
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", 
      padding: 24,
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)"
    }}>
      <div
        ref={chatListRef}
        style={{
          height: 400,
          marginBottom: 20,
          overflowY: "auto",
          padding: "16px 0",
          background: "transparent"
        }}
      >
        {chatHistory.map((item, idx) => (
          <div key={idx} style={{ 
            textAlign: item.role === "user" ? "right" : "left", 
            margin: "12px 0",
            padding: "8px 0"
          }}>
            <div style={{
              display: "inline-block",
              maxWidth: "70%",
              padding: "12px 16px",
              borderRadius: item.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: item.role === "user" 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                : item.role === "tip" 
                ? "#f0f0f0" 
                : "#f8f9fa",
              color: item.role === "user" ? "white" : "#333",
              fontSize: "14px",
              lineHeight: "1.5",
              boxShadow: item.role === "user" ? "0 2px 8px rgba(102, 126, 234, 0.3)" : "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {item.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Request Reference Display */}
      {requestReference && (
        <div style={{ 
          marginBottom: 16, 
          padding: "8px 12px", 
          background: "rgba(0, 123, 255, 0.1)", 
          borderRadius: 8,
          fontSize: "12px",
          color: "#666"
        }}>
          <strong>Request Reference:</strong> {requestReference}
        </div>
      )}
      
      <div style={{ 
        background: "rgba(255, 255, 255, 0.8)", 
        borderRadius: 16, 
        padding: "16px",
        border: "1px solid rgba(255, 255, 255, 0.3)"
      }}>
        <Input.TextArea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Type your question here..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading}
          onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "14px",
            resize: "none"
          }}
        />
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <Button 
            type="primary" 
            onClick={handleSend} 
            loading={loading} 
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "12px",
              height: "40px",
              padding: "0 24px",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox; 