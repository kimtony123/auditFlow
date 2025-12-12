import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "../../services/WalletProvider";
import { useTheme } from "../../services/ThemeProvider";
import "./NavBar.css";

// Import your logo - you may need to adjust the import based on your setup
import logoImage from "../assets/image.jpg";

interface NavBarProps {
  variant?: "landing" | "dashboard";
  showConnectButton?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ 
  variant = "landing", 
  showConnectButton = true 
}) => {
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleConnect = async () => {
    await connectWallet();
    // Navigate to dashboard after connecting
    if (isConnected && variant === "landing") {
      navigate("/dashboard");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsUserMenuOpen(false);
    if (variant === "dashboard") {
      navigate("/");
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return "Unknown";
    
    const networks: Record<number, string> = {
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      43114: "Avalanche",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      100: "Gnosis",
      250: "Fantom",
      1666600000: "Harmony",
      1284: "Moonbeam",
      1285: "Moonriver",
    };
    
    return networks[chainId] || `Chain ${chainId}`;
  };

  // Navigation links based on variant
  const navLinks = {
    landing: [
      { path: "/", label: "Home", badge: undefined },
      { path: "/#features", label: "Features", badge: undefined },
      { path: "/#pricing", label: "Pricing", badge: undefined },
      { path: "/#how-it-works", label: "How It Works", badge: undefined },
      { path: "/stake", label: "Stake", badge: undefined },
    ],
    dashboard: [
      { path: "/dashboard", label: "Dashboard", badge: undefined },
      { path: "/analyze", label: "Analyze", badge: undefined },
      { path: "/stake", label: "Stake", badge: undefined },
      { path: "/notifications", label: "Notifications", badge: true },
    ]
  };

  const currentLinks = navLinks[variant];

  return (
    <nav className={`navbar ${variant} ${theme}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/" className="logo-link">
            <img 
              src={logoImage} 
              alt="AuditFlow" 
              className="logo-image"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="logo-fallback">
                    <span class="logo-icon">🛡️</span>
                    <span class="logo-text">AuditFlow</span>
                  </div>
                `;
              }}
            />
            <span className="logo-text">AuditFlow</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navigation Links (Desktop) */}
        <div className="navbar-links desktop">
          {currentLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
              {link.badge && <span className="nav-badge">3</span>}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <span className="theme-icon">🌙</span>
            ) : (
              <span className="theme-icon">☀️</span>
            )}
          </button>

          {/* Wallet Connection */}
          {showConnectButton && (
            <div className="wallet-section">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="connect-wallet-btn"
                >
                  <span className="wallet-icon">🦊</span>
                  Connect Wallet
                </button>
              ) : (
                <div className="user-menu-container" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="user-menu-trigger"
                    aria-label="User menu"
                  >
                    <div className="user-avatar">
                      {account ? (
                        <span className="avatar-text">
                          {account.slice(2, 4).toUpperCase()}
                        </span>
                      ) : (
                        <span className="avatar-icon">👤</span>
                      )}
                    </div>
                    <span className="user-address">{formatAddress(account)}</span>
                    <span className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}>▼</span>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      {/* User Info Section */}
                      <div className="dropdown-section user-info-section">
                        <div className="user-wallet">
                          <div className="wallet-address-display">
                            <span className="label">Wallet:</span>
                            <span className="address">{formatAddress(account)}</span>
                            <button 
                              className="copy-address"
                              onClick={() => {
                                if (account) {
                                  navigator.clipboard.writeText(account);
                                  // You could add a toast notification here
                                }
                              }}
                              aria-label="Copy address"
                            >
                              📋
                            </button>
                          </div>
                          <div className="wallet-network">
                            <span className="network-dot"></span>
                            <span className="network-name">Connected</span>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="dropdown-section">
                        <Link 
                          to="/dashboard" 
                          className="dropdown-link"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="link-icon">📊</span>
                          Dashboard
                        </Link>
                        <Link 
                          to="/settings" 
                          className="dropdown-link"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="link-icon">⚙️</span>
                          Settings
                        </Link>
                        <Link 
                          to="/notifications" 
                          className="dropdown-link"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="link-icon">🔔</span>
                          Notifications
                          <span className="notification-badge">3</span>
                        </Link>
                      </div>

                      {/* Actions Section */}
                      <div className="dropdown-section">
                        <button 
                          className="dropdown-link disconnect"
                          onClick={handleDisconnect}
                        >
                          <span className="link-icon">🚪</span>
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu" ref={mobileMenuRef}>
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                {isConnected ? (
                  <>
                    <div className="mobile-avatar">
                      {account?.slice(2, 4).toUpperCase() || "👤"}
                    </div>
                    <div className="mobile-wallet-info">
                      <div className="mobile-address">{formatAddress(account)}</div>
                      <div className="mobile-network">Connected</div>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="mobile-connect-btn"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            <div className="mobile-nav-links">
              {currentLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.badge && <span className="mobile-badge">3</span>}
                </Link>
              ))}
              
              {/* Additional mobile-only links */}
              {isConnected && (
                <>
                  <div className="mobile-divider"></div>
                  <Link
                    to="/settings"
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mobile-link-icon">⚙️</span>
                    Settings
                  </Link>
                  <Link
                    to="/notifications"
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mobile-link-icon">🔔</span>
                    Notifications
                    <span className="mobile-badge">3</span>
                  </Link>
                  <button
                    className="mobile-nav-link disconnect"
                    onClick={() => {
                      handleDisconnect();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-link-icon">🚪</span>
                    Disconnect
                  </button>
                </>
              )}
            </div>

            <div className="mobile-menu-footer">
              <button
                onClick={toggleTheme}
                className="mobile-theme-toggle"
              >
                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;