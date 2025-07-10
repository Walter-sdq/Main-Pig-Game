import React from 'react'
import { useGame } from '../contexts/GameContext'
import { useSound } from '../contexts/SoundContext'
import Player from './Player'
import Dice from './Dice'
import GameControls from './GameControls'
import TurnSwitchAnimation from './TurnSwitchAnimation'
import ConfettiAnimation from './ConfettiAnimation'
import LoadingOverlay from './LoadingOverlay'
import ParticleSystem from './ParticleSystem'

const GameBoard = ({ onShowRules, onShowMultiplayer }) => {
  const { gameState, isLoading } = useGame()
  const { isMuted, toggleMute } = useSound()

  return (
    <main className="game-board">
      {/* Rules Button */}
      <button className="rules-btn" onClick={onShowRules}>
        📔
      </button>

      {/* Sound Toggle */}
      <button className="sound-toggle" onClick={toggleMute}>
        {isMuted ? '🔇' : '🎵'}
      </button>

      {/* Multiplayer Button */}
      <button className="btn btn--multiplayer" onClick={onShowMultiplayer}>
        🌐 Multiplayer
      </button>

      {/* Players */}
      <Player 
        playerIndex={0} 
        isActive={gameState.activePlayer === 0}
        isWinner={gameState.winner === 0}
      />
      
      <Player 
        playerIndex={1} 
        isActive={gameState.activePlayer === 1}
        isWinner={gameState.winner === 1}
      />

      {/* Dice */}
      <Dice />

      {/* Game Controls */}
      <GameControls />

      {/* Animations */}
      <TurnSwitchAnimation />
      <ConfettiAnimation />
      <ParticleSystem />

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </main>
  )
}

export default GameBoard