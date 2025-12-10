import React from "react";
import { ConnectButton } from "@arweave-wallet-kit/react";

const WalletConnectButton: React.FC = () => {
  return (
    <div style={{ 
      position: "absolute", 
      top: 20, 
      right: 20, 
      zIndex: 1000,
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: 12,
      padding: "4px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)"
    }}>
      <ConnectButton 
        profileModal={false} 
        showBalance={false}
        accent="#667eea"
        style={{
          borderRadius: "8px",
          fontWeight: 600
        }}
      />
    </div>
  );
};

export default WalletConnectButton; 