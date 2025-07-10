import React from 'react'
import { useGame } from '../contexts/GameContext'

const ConfettiAnimation = () => {
  const { gameState, showConfetti } = useGame()

  if (!showConfetti || gameState.winner === null) return null

  return (
    <>
      <img
        src="/img/confetti-animation.gif"
        alt="Confetti celebration"
        className="confetti confetti--left confetti--show"
      />
      <img
        src="/img/confetti-animation.gif"
        alt="Confetti celebration"
        className="confetti confetti--right confetti--show"
      />
    </>
  )
}

export default ConfettiAnimation