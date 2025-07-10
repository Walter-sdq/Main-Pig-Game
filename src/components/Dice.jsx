import React from 'react'
import { useGame } from '../contexts/GameContext'

const Dice = () => {
  const { gameState, isRolling } = useGame()

  if (!gameState.diceValue) return null

  return (
    <img
      src={`/img/dice-${gameState.diceValue}.png`}
      alt={`Dice showing ${gameState.diceValue}`}
      className={`dice ${isRolling ? 'dice--rolling' : ''}`}
    />
  )
}

export default Dice