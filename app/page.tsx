export default function Home() {
  return (
    <main style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Nexus Signaling Server</h1>
      <p>WebRTC signaling server for P2P messenger</p>

      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /api/socket</code> - Server info</li>
        <li><code>WebSocket /api/socket</code> - Signaling (Socket.IO)</li>
      </ul>

      <h2>Authentication</h2>
      <p>Connect with JWT token in <code>auth.token</code> field.</p>

      <h2>Events</h2>
      <h3>Client to Server</h3>
      <ul>
        <li><code>join</code> - Join server</li>
        <li><code>offer</code> - Send WebRTC offer</li>
        <li><code>answer</code> - Send WebRTC answer</li>
        <li><code>iceCandidate</code> - Send ICE candidate</li>
        <li><code>leave</code> - Leave server</li>
        <li><code>ping</code> - Health check</li>
      </ul>

      <h3>Server to Client</h3>
      <ul>
        <li><code>offer</code> - Received offer</li>
        <li><code>answer</code> - Received answer</li>
        <li><code>iceCandidate</code> - Received ICE</li>
        <li><code>userJoined</code> - User online</li>
        <li><code>userLeft</code> - User offline</li>
        <li><code>error</code> - Error</li>
        <li><code>pong</code> - Ping response</li>
      </ul>

      <h2>Status</h2>
      <p style={{ color: 'green' }}>Server running</p>
    </main>
  );
}