import React from 'react'
import { useGame } from '../contexts/GameContext'
import { useMultiplayer } from '../contexts/MultiplayerContext'

const Player = ({ playerIndex, isActive, isWinner }) => {
  const { gameState } = useGame()
  const { isMultiplayerMode, gameData } = useMultiplayer()

  const getPlayerName = () => {
    if (isMultiplayerMode && gameData) {
      const playerId = gameData.players[playerIndex]
      return gameData.playerNames[playerId] || `Player ${playerIndex + 1}`
    }
    return gameState.playerNames[playerIndex]
  }

  const getPlayerAvatar = () => {
    if (isMultiplayerMode && gameData) {
      const playerId = gameData.players[playerIndex]
      return gameData.playerAvatars?.[playerId] || null
    }
    return null
  }

  const playerClasses = [
    'player',
    `player--${playerIndex}`,
    isActive && 'player--active',
    isWinner && 'player--winner'
  ].filter(Boolean).join(' ')

  const avatar = getPlayerAvatar()

  return (
    <section className={playerClasses}>
      <div className="player-header">
        {avatar && <span className="player-avatar">{avatar}</span>}
        <h2 className="name">
          {getPlayerName()}
        </h2>
      </div>
      
      <p className="score">
        {gameState.scores[playerIndex]}
      </p>
      
      <div className="current">
        <p className="current-label">Current</p>
        <p className="current-score">
          {gameState.currentScores[playerIndex]}
        </p>
      </div>
    </section>
  )
}

export default Player