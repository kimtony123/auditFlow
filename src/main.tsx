import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import { ArweaveWalletKit } from "@arweave-wallet-kit/react"; // Updated import
import WanderStrategy from "@arweave-wallet-kit/wander-strategy";
import OthentStrategy from "@arweave-wallet-kit/othent-strategy";
import BrowserWalletStrategy from "@arweave-wallet-kit/browser-wallet-strategy";
import WebWalletStrategy from "@arweave-wallet-kit/webwallet-strategy";
import { ConfigProvider } from "antd";
import { config } from "./config";
import "./index.css";

const root = document.getElementById("root");

if (root) {
  const reactRoot = createRoot(root);
  
  reactRoot.render(
    <React.StrictMode>
      <ArweaveWalletKit
        config={{
          permissions: [...config.walletPermissions],
          ensurePermissions: config.ensurePermissions,
          strategies: [ // Add strategies array
            new WanderStrategy(),
            new OthentStrategy(),
            new BrowserWalletStrategy(),
            new WebWalletStrategy(),
          ],
          appInfo: {
            name: config.appName,
            logo: config.appLogo,
          },
        }}
        theme={{
          accent: config.theme.accent,
        }}
      >
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </ArweaveWalletKit>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}