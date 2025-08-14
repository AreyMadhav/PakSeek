import React, { useRef, useEffect, useState } from 'react';
import { DependencyNode } from '../types';

interface DependencyGraphProps {
  nodes: DependencyNode[];
}

export default function DependencyGraph({ nodes }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      drawGraph();
    };

    const drawGraph = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // Draw connections first
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      nodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const targetNode = nodes.find(n => n.id === connectionId);
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const radius = 30;
        
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = getNodeColor(node.type);
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.substring(0, 8) + '...', node.x, node.y - 40);
        ctx.fillText(node.type, node.x, node.y + 50);
      });

      ctx.restore();
    };

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'Texture': return '#10b981';
        case 'Audio': return '#8b5cf6';
        case 'Mesh': return '#3b82f6';
        case 'Material': return '#f59e0b';
        case 'Blueprint': return '#ef4444';
        default: return '#6b7280';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes, scale, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden h-full">
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Dependency Graph</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Zoom: {Math.round(scale * 100)}%</span>
            <button
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="px-2 py-1 bg-gray-700/50 rounded text-xs hover:bg-gray-600/50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ height: 'calc(100% - 73px)' }}
      />
    </div>
  );
}