# AuditFlow: Automated Web3 Audit Preparation

A modern platform that transforms smart contract code into auditor-ready reports with AI-powered risk analysis, cutting preparation time by 90% and costs by up to 40%.

## 🚀 Features

### Core Features
- **GitHub Repository Analysis**: Connect any GitHub repo for instant smart contract analysis
- **AI-Powered Risk Detection**: Pattern recognition trained on 500+ public audit reports
- **Automated Report Generation**: Professionally formatted PDF reports with architecture diagrams
- **Real-time Vulnerability Scanning**: 50+ vulnerability patterns including reentrancy, access control issues
- **Team Collaboration**: Multi-member workspace for development teams

### Security Features
- **Smart Contract Inventory**: Automatic detection and categorization of all contracts
- **Privilege Level Analysis**: Mapping of admin functions and access controls
- **External Call Mapping**: Visualization of all contract interactions
- **Dependency Analysis**: Understanding of contract relationships and dependencies

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: CSS Modules with modern security-themed design system
- **Blockchain Integration**: Ethereum, Lisk (initially), with multi-chain support planned
- **AI/ML**: Custom-trained models on audit report datasets
- **Backend Services**: Node.js + Python analysis engines
- **Security Tools**: Integration with Slither, Mythril, Semgrep
- **Hosting**: Vercel + AWS Lambda functions

## 📁 Project Structure

```
auditflow/
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components (Home, Dashboard, etc.)
│   ├── services/          # API and blockchain services
│   ├── utils/             # Utility functions and helpers
│   ├── config/            # Configuration files
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── ao_process/           # AO Network process for AI inference (future)
└── tests/                # Test files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- Modern web browser with wallet extension (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/auditflow.git
   cd auditflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```


### AO Network Integration (Future)
For AI inference features, you'll need an AO process deployed:

```bash
cd ao_process
# Follow AO deployment instructions
```

## 📊 Usage

### 1. Connect GitHub Repository
- Navigate to the dashboard
- Click "Connect GitHub"
- Grant read-only access to your repositories
- Select the repository to analyze

### 2. Run Analysis
- Select analysis type (Quick, Standard, or Deep)
- Review the analysis queue
- Download reports when complete

### 3. Review AI Insights
- View vulnerability probability scores
- Check gas optimization suggestions
- Review architectural recommendations

### 4. Generate Audit-Ready Package
- Export to PDF with executive summary
- Share with team members
- Submit directly to audit firms

## 💰 Pricing Tiers

| Feature | Basic (Free) | Premium ($15/mo) | Pro ($50/mo) | Enterprise |
|---------|--------------|------------------|--------------|------------|
| Code Summaries | 5/month | 15/month | 100+/month | Unlimited |
| AI Reports | 1/month | 10/month | 40+/month | Unlimited |
| Team Members | 1 | 1 | Up to 5 | 10+ |
| Support | Community | Email | Priority | 24/7 |
| API Access | ❌ | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ✅ | ✅ |

### Discounts Available
- **Quarterly billing**: Save 5%
- **Semi-annual billing**: Save 15%
- **Annual billing**: Save 30%

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Analytics

The platform includes built-in analytics for:
- Usage patterns by project size
- Common vulnerability types detected
- Average time saved per audit
- User satisfaction metrics


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please report it on our [GitHub Issues](https://github.com/yourusername/auditflow/issues) page with:
1. Description of the bug
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Website**: [auditflow.io](https://auditflow.arlink.arweave.net)
- **GitHub Issues**: [Bug reports & feature requests](https://github.com/yourusername/auditflow/issues)

---

**AuditFlow** - Making Web3 security accessible, affordable, and efficient for every developer.

*"Get Audit-Ready in Minutes, Not Weeks."*