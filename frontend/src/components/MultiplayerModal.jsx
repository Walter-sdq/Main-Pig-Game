import React, { useState } from 'react'
import { useMultiplayer } from '../contexts/MultiplayerContext'
import { useSound } from '../contexts/SoundContext'

const MultiplayerModal = ({ onClose }) => {
  const {
    isConnected,
    isInLobby,
    playerInfo,
    lobbyPlayers,
    activeGames,
    leaderboard,
    connectToLobby,
    requestGame,
    watchGame,
    leaveGame
  } = useMultiplayer()

  const { isMuted, toggleMute } = useSound()

  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🐷')

  const avatars = ['🐷', '🐸', '🦊', '🐼', '🦁', '👾', '🤖', '🦄', '🐨', '🐯']

  const handleConnect = () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }
    
    connectToLobby({
      playerName: playerName.trim(),
      playerId: playerId.trim().toUpperCase() || null,
      avatar: selectedAvatar
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal multiplayer-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        {/* Sound Toggle */}
        <button 
          className="sound-toggle" 
          onClick={toggleMute}
          style={{ position: 'absolute', top: '1rem', right: '4rem' }}
        >
          {isMuted ? '🔇 Music Off' : '🎵 Music On'}
        </button>

        <h2>🌐 Multiplayer Lobby</h2>

        {/* Connection Status */}
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'status-indicator--online' : 'status-indicator--offline'}`} />
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {!isInLobby ? (
          /* Player Setup */
          <div className="player-setup">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            
            <input
              type="text"
              placeholder="Custom ID (optional)"
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              maxLength={4}
            />

            <div className="avatar-picker">
              <label>Select Avatar:</label>
              {avatars.map(avatar => (
                <span
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'avatar-option--selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </span>
              ))}
            </div>

            <button className="connect-btn" onClick={handleConnect}>
              Connect to Lobby
            </button>
          </div>
        ) : (
          /* Lobby Content */
          <div className="lobby-content">
            {playerInfo && (
              <div className="player-info" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <span>You are: <strong>{playerInfo.name} ({playerInfo.id}) {playerInfo.avatar}</strong></span>
              </div>
            )}

            {/* Online Players */}
            <div className="players-list">
              <h3>Online Players</h3>
              {lobbyPlayers.length === 0 ? (
                <p>No other players online</p>
              ) : (
                lobbyPlayers.map(player => (
                  <div key={player.id} className="player-item">
                    <span>
                      {player.avatar} {player.name} ({player.id})
                    </span>
                    <button 
                      className="challenge-btn"
                      onClick={() => requestGame(player.id)}
                    >
                      Challenge
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Active Games */}
            <div className="games-list">
              <h3>Active Games (Click to Watch)</h3>
              {activeGames.length === 0 ? (
                <p>No active games</p>
              ) : (
                activeGames.map(game => (
                  <div key={game.id} className="game-item">
                    <div>
                      <div>{game.players.join(' vs ')}</div>
                      <small>Game ID: {game.id} • Watchers: {game.watchers}</small>
                    </div>
                    <button 
                      className="watch-btn"
                      onClick={() => watchGame(game.id)}
                    >
                      Watch
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Leaderboard */}
            <div className="leaderboard-section">
              <h3>🏆 Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <p>No games played yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Avatar</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Wins</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Losses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, index) => (
                      <tr key={player.id}>
                        <td style={{ padding: '0.5rem' }}>{index + 1}</td>
                        <td style={{ padding: '0.5rem', fontSize: '1.7rem' }}>{player.avatar || '👤'}</td>
                        <td style={{ padding: '0.5rem' }}>{player.name}</td>
                        <td style={{ padding: '0.5rem' }}>{player.wins}</td>
                        <td style={{ padding: '0.5rem' }}>{player.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Leave Game Button (if in game) */}
            <button 
              className="btn" 
              onClick={leaveGame}
              style={{ 
                position: 'relative', 
                left: 'auto', 
                transform: 'none', 
                marginTop: '2rem',
                background: '#ef4444'
              }}
            >
              Leave Game
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultiplayerModal