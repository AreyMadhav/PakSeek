import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const initWindow = async () => {
      try {
        const window = getCurrentWindow();
        
        // Check initial maximized state
        const maximized = await window.isMaximized();
        setIsMaximized(maximized);
        console.log('Initial maximized state:', maximized);

        // Listen for window state changes
        const unlisten = await window.onResized(() => {
          window.isMaximized().then((maximized: boolean) => {
            setIsMaximized(maximized);
            console.log('Window resized, maximized:', maximized);
          });
        });

        return () => {
          unlisten();
        };
      } catch (error) {
        console.warn('Failed to initialize window controls:', error);
      }
    };

    initWindow();
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('Minimize button clicked');
      const window = getCurrentWindow();
      await window.minimize();
      console.log('Window minimized');
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('Maximize button clicked, current state:', isMaximized);
      const window = getCurrentWindow();
      if (isMaximized) {
        await window.unmaximize();
        console.log('Window unmaximized');
      } else {
        await window.maximize();
        console.log('Window maximized');
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('Close button clicked');
      const window = getCurrentWindow();
      await window.close();
      console.log('Window closing');
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div
      className="flex items-center justify-between h-8 bg-gray-900 border-b border-gray-700 select-none fixed top-0 left-0 right-0 z-50"
    >
      {/* Left section - App title with drag area */}
      <div 
        className="flex-1 flex items-center px-4 h-full"
        data-tauri-drag-region
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">UE</span>
          </div>
          <span className="text-sm font-medium text-gray-200">
            Unreal Engine Mapper
          </span>
        </div>
      </div>

      {/* Right section - Window controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-12 h-full flex items-center justify-center hover:bg-gray-600 active:bg-gray-500 transition-colors group cursor-pointer border-0 bg-transparent"
          title="Minimize"
          type="button"
        >
          <Minus size={16} className="text-gray-300 group-hover:text-white pointer-events-none" />
        </button>
        
        <button
          onClick={handleMaximize}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-12 h-full flex items-center justify-center hover:bg-gray-600 active:bg-gray-500 transition-colors group cursor-pointer border-0 bg-transparent"
          title={isMaximized ? "Restore" : "Maximize"}
          type="button"
        >
          {isMaximized ? (
            <Copy size={12} className="text-gray-300 group-hover:text-white pointer-events-none" />
          ) : (
            <Square size={14} className="text-gray-300 group-hover:text-white pointer-events-none" />
          )}
        </button>
        
        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-12 h-full flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors group cursor-pointer border-0 bg-transparent"
          title="Close"
          type="button"
        >
          <X size={16} className="text-gray-300 group-hover:text-white pointer-events-none" />
        </button>
      </div>
    </div>
  );
};
