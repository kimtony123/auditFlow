export const config = {
 
  // App Configuration
  appName: 'aoBudgetAI',
  appLogo: './assets/cover.png',
  
  // UI Configuration
  theme: {
    accent: { r: 9, g: 29, b: 255 },
  },
  
  // Wallet Configuration
  walletPermissions: ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'] as const,
  ensurePermissions: true,
} as const; 