export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)'
    }}>
      <h1 style={{ color: '#3b82f6', fontSize: '3.5rem', marginBottom: '0.5rem' }}>TokenFlip</h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '400px' }}>
        The ultimate 1v1 USDC duel on Base blockchain.
      </p>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem 3rem', 
        borderRadius: '50px', 
        border: '1px solid #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#60a5fa',
        fontWeight: 'bold',
        animation: 'pulse 2s infinite'
      }}>
        Verifying Application...
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
