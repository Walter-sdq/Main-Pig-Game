import React, { useEffect, useState } from 'react'
import { useGame } from '../contexts/GameContext'

const ParticleSystem = () => {
  const { gameState, showConfetti } = useGame()
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (showConfetti && gameState.winner !== null) {
      createConfettiParticles()
    }
  }, [showConfetti, gameState.winner])

  const createConfettiParticles = () => {
    const newParticles = []
    const colors = ['#667eea', '#764ba2', '#c7365f', '#22c55e', '#f59e0b', '#ef4444']
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2
      })
    }
    
    setParticles(newParticles)
    
    // Clear particles after animation
    setTimeout(() => {
      setParticles([])
    }, 5000)
  }

  if (particles.length === 0) return null

  return (
    <div className="particles">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle particle--confetti"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  )
}

export default ParticleSystem