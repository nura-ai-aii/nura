import React, { useState, useEffect, useRef } from 'react';
import './DraggableComponent.css';
import { emitAlert } from './AlertSystem';

export default function DraggableComponent({ children, id, initialPos = { bottom: 30, right: 30 } }) {
  // Load saved position
  const getInitialPos = () => {
    try {
      const saved = localStorage.getItem(`nura_pos_${id}`);
      return saved ? JSON.parse(saved) : initialPos;
    } catch (e) {
      return initialPos;
    }
  };

  const [position, setPosition] = useState(getInitialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const dragStart = useRef({ x: 0, y: 0, initRight: 0, initBottom: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Right Click
  const handleContextMenu = (e) => {
    if (isMobile) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // Close menu on click elsewhere
  useEffect(() => {
    const handleClick = () => {
      if (showMenu) setShowMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showMenu]);

  const startMove = (e) => {
    if (e) e.stopPropagation();
    setIsMoveMode(true);
    setShowMenu(false);
  };

  const savePosition = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setIsMoveMode(false);
      setIsDragging(false);
      localStorage.setItem(`nura_pos_${id}`, JSON.stringify(position));
      setShowMenu(false);
      
      // Visual feedback
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 800);
      
      // On-screen notification
      emitAlert('POSITION_SAVED', `${id.toUpperCase().replace('WIDGET-', '')} POSITION SECURED`, false);
      console.log(`[NURA] Position saved for ${id}:`, position);
    } catch (err) {
      console.error("Save failed:", err);
      emitAlert('SAVE_ERROR', 'ENCRYPTION FAILURE: POSITION NOT SAVED', true);
    }
  };

  // Drag Logic
  const handleMouseDown = (e) => {
    if (!isMoveMode) return;
    if (e.button !== 0) return; // Only left click for dragging
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initRight: position.right,
      initBottom: position.bottom
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const newPos = {
        right: dragStart.current.initRight - dx,
        bottom: dragStart.current.initBottom - dy
      };
      setPosition(newPos);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`draggable-wrapper ${isMoveMode ? 'move-mode' : ''} ${isDragging ? 'dragging' : ''} ${isSaved ? 'saved' : ''}`}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      style={isMobile ? {
        position: 'relative',
        bottom: 'auto',
        right: 'auto',
        left: 'auto',
        width: '100%',
        margin: '10px 0',
        zIndex: id === 'plasma-orb' ? 1000 : 900
      } : {
        position: 'fixed',
        bottom: position.bottom + 'px',
        right: position.right + 'px',
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: isMoveMode ? 5000 : (id === 'plasma-orb' ? 1000 : 900)
      }}
    >
      {children}

      {/* Context Menu */}
      {showMenu && (
        <div 
          className="nura-context-menu"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: menuPos.y, left: menuPos.x }}
        >
          {!isMoveMode ? (
            <button onMouseDown={startMove}>◆ MOVE COMPONENT</button>
          ) : (
            <button onMouseDown={savePosition}>✔ SAVE POSITION</button>
          )}
        </div>
      )}
    </div>
  );
}
