import React from 'react'
import { useGame } from '../contexts/GameContext'
import { useMultiplayer } from '../contexts/MultiplayerContext'

const GameControls = () => {
  const { 
    gameState, 
    isRolling, 
    newGame, 
    rollDice, 
    holdScore 
  } = useGame()
  
  const { 
    isMultiplayerMode, 
    isMyTurn, 
    rollDiceMultiplayer, 
    holdScoreMultiplayer 
  } = useMultiplayer()

  const handleRollDice = () => {
    if (isMultiplayerMode) {
      rollDiceMultiplayer()
    } else {
      rollDice()
    }
  }

  const handleHoldScore = () => {
    if (isMultiplayerMode) {
      holdScoreMultiplayer()
    } else {
      holdScore()
    }
  }

  const isDisabled = () => {
    if (isMultiplayerMode) {
      return !isMyTurn() || !gameState.playing || isRolling
    }
    return !gameState.playing || isRolling
  }

  return (
    <>
      <button 
        className="btn btn--new" 
        onClick={newGame}
        disabled={isMultiplayerMode}
      >
        🔄 New game
      </button>
      
      <button 
        className="btn btn--roll" 
        onClick={handleRollDice}
        disabled={isDisabled()}
      >
        🎲 Roll dice
      </button>
      
      <button 
        className="btn btn--hold" 
        onClick={handleHoldScore}
        disabled={isDisabled()}
      >
        📥 Hold
      </button>
    </>
  )
}

export default GameControls