import React from 'react';

// Simple test component to verify React is working
function TestApp() {
  return (
    <div style={{
      background: '#1e293b',
      color: 'white',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>
        <h1>Unreal Engine Mapper</h1>
        <p>Frontend is working!</p>
        <p>React loaded successfully.</p>
      </div>
    </div>
  );
}

export default TestApp;
