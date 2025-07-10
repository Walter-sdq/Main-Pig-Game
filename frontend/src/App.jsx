import React, { useState } from 'react'
import GameBoard from './components/GameBoard'
import MultiplayerModal from './components/MultiplayerModal'
import RulesModal from './components/RulesModal'
import { GameProvider } from './contexts/GameContext'
import { MultiplayerProvider } from './contexts/MultiplayerContext'
import { SoundProvider } from './contexts/SoundContext'

function App() {
  const [showRules, setShowRules] = useState(false)
  const [showMultiplayer, setShowMultiplayer] = useState(false)

  return (
    <SoundProvider>
      <GameProvider>
        <MultiplayerProvider>
          <div className="app">
            <GameBoard 
              onShowRules={() => setShowRules(true)}
              onShowMultiplayer={() => setShowMultiplayer(true)}
            />
            
            {showRules && (
              <RulesModal onClose={() => setShowRules(false)} />
            )}
            
            {showMultiplayer && (
              <MultiplayerModal onClose={() => setShowMultiplayer(false)} />
            )}
          </div>
        </MultiplayerProvider>
      </GameProvider>
    </SoundProvider>
  )
}

export default App