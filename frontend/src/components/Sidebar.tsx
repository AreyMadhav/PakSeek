import React from 'react';
import { Home, Database, GitBranch, Settings, Menu, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const menuItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assets', label: 'Asset Browser', icon: Database },
  { id: 'graph', label: 'Dependency Graph', icon: GitBranch },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ currentPage, onPageChange, isCollapsed, onToggleCollapsed }: SidebarProps) {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

  return (
    <div className={`${
      isCollapsed ? 'w-16' : 'w-64'
    } transition-all duration-300 bg-gray-900/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-white font-semibold">Asset Mapper</h1>
            </div>
          )}
          <button
            onClick={onToggleCollapsed}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4 text-gray-400" />
            ) : (
              <X className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              style={isActive ? {
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
              } : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            UE Asset Mapper v1.0
          </div>
        </div>
      )}
    </div>
  );
}