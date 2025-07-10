import React from 'react'
import { useGame } from '../contexts/GameContext'

const TurnSwitchAnimation = () => {
  const { showTurnSwitch, turnSwitchDirection } = useGame()

  if (!showTurnSwitch) return null

  const gifClasses = [
    'turn-switch-gif',
    'turn-switch-gif--show',
    turnSwitchDirection === 'left' && 'turn-switch-gif--left'
  ].filter(Boolean).join(' ')

  return (
    <img
      src="/img/nextGif.gif"
      alt="Turn switching"
      className={gifClasses}
    />
  )
}

export default TurnSwitchAnimation