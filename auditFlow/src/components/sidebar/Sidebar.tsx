import React from "react";
import { Link } from "react-router-dom";
import { useUserData } from "../../context/UserDataContext"; // ADD THIS
import "./Sidebar.css";

interface SidebarProps {
  collapsed?: boolean;
  // REMOVED PROPS: userTier and userUsage
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false
  // REMOVED: userTier and userUsage props
}) => {
  
  const { userTier, usageInfo } = useUserData(); // GET DATA DIRECTLY FROM CONTEXT

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
        
        <div className="sidebar-section">
          <h4>Recent Analyses</h4>
          <div className="recent-list">
            {usageInfo?.totalAnalyses ? (
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