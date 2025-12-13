import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

interface SidebarProps {
  collapsed?: boolean;
  userTier?: 'basic' | 'premium' | 'pro' | 'enterprise';
  userUsage?: {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  userTier = 'basic',
  userUsage 
}) => {
  const location = useLocation();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return '#64748b';
      case 'premium': return '#3b82f6';
      case 'pro': return '#8b5cf6';
      case 'enterprise': return '#f59e0b';
      default: return '#64748b';
    }
  };

  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>Menu</h3>
      </div>
      
      <div className="sidebar-divider"></div>
      
      <nav className="sidebar-nav">
       
        <Link 
          to="/analyze" 
          className={`sidebar-link ${location.pathname === '/analyze' ? 'active' : ''}`}
        >
          <span className="sidebar-icon">✨</span>
          <span className="sidebar-text">New Analysis</span>
        </Link>
        
        
        <div className="sidebar-divider"></div>
        
        <div className="sidebar-section">
          <h4>Recent Analyses</h4>
          <div className="recent-list">
            {userUsage?.totalAnalyses ? (
              <>
                <Link to="/dashboard/analysis/1" className="recent-item">
                  <span className="recent-icon">📄</span>
                  <span className="recent-text">Sample Audit</span>
                  <span className="recent-date">2 days ago</span>
                </Link>
                <Link to="/dashboard/analysis/2" className="recent-item">
                  <span className="recent-icon">📄</span>
                  <span className="recent-text">Contract Review</span>
                  <span className="recent-date">1 week ago</span>
                </Link>
              </>
            ) : (
              <div className="no-recent">
                <span className="no-recent-icon">📭</span>
                <span className="no-recent-text">No analyses yet</span>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-stats">
          <div className="stat">
            <span className="stat-label">Current Tier:</span>
            <span 
              className="stat-value tier-badge" 
              style={{ background: getTierColor(userTier) }}
            >
              {userTier}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;