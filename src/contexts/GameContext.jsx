import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSound } from './SoundContext'

const GameContext = createContext()

const initialState = {
  scores: [0, 0],
  currentScores: [0, 0],
  activePlayer: 0,
  playing: true,
  winner: null,
  diceValue: null,
  playerNames: ['Player 1', 'Player 2'],
  showTurnSwitch: false,
  turnSwitchDirection: 'right',
  showConfetti: false,
  isLoading: false
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return {
        ...initialState,
        isLoading: true
      }

    case 'FINISH_LOADING':
      return {
        ...state,
        isLoading: false
      }

    case 'SET_DICE_VALUE':
      return {
        ...state,
        diceValue: action.payload
      }

    case 'ADD_TO_CURRENT_SCORE':
      const newCurrentScores = [...state.currentScores]
      newCurrentScores[state.activePlayer] += action.payload
      return {
        ...state,
        currentScores: newCurrentScores
      }

    case 'RESET_CURRENT_SCORE':
      const resetCurrentScores = [...state.currentScores]
      resetCurrentScores[state.activePlayer] = 0
      return {
        ...state,
        currentScores: resetCurrentScores
      }

    case 'HOLD_SCORE':
      const newScores = [...state.scores]
      newScores[state.activePlayer] += state.currentScores[state.activePlayer]
      
      const holdCurrentScores = [...state.currentScores]
      holdCurrentScores[state.activePlayer] = 0

      // Check for winner
      if (newScores[state.activePlayer] >= 100) {
        return {
          ...state,
          scores: newScores,
          currentScores: holdCurrentScores,
          playing: false,
          winner: state.activePlayer,
          showConfetti: true
        }
      }

      return {
        ...state,
        scores: newScores,
        currentScores: holdCurrentScores
      }

    case 'SWITCH_PLAYER':
      return {
        ...state,
        activePlayer: state.activePlayer === 0 ? 1 : 0,
        showTurnSwitch: true,
        turnSwitchDirection: state.activePlayer === 0 ? 'right' : 'left'
      }

    case 'HIDE_TURN_SWITCH':
      return {
        ...state,
        showTurnSwitch: false
      }

    case 'HIDE_CONFETTI':
      return {
        ...state,
        showConfetti: false
      }

    case 'UPDATE_MULTIPLAYER_STATE':
      return {
        ...state,
        ...action.payload
      }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialState)
  const [isRolling, setIsRolling] = React.useState(false)
  const { playSound } = useSound()

  // Auto-hide turn switch animation
  useEffect(() => {
    if (gameState.showTurnSwitch) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TURN_SWITCH' })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState.showTurnSwitch])

  // Auto-hide confetti
  useEffect(() => {
    if (gameState.showConfetti) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_CONFETTI' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState.showConfetti])

  // Handle loading animation
  useEffect(() => {
    if (gameState.isLoading) {
      const timer = setTimeout(() => {
        dispatch({ type: 'FINISH_LOADING' })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState.isLoading])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        newGame()
      } else if (e.key === 'r' || e.key === 'R') {
        rollDice()
      } else if (e.key === 'h' || e.key === 'H') {
        holdScore()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [gameState.playing])

  const newGame = () => {
    dispatch({ type: 'NEW_GAME' })
  }

  const rollDice = async () => {
    if (!gameState.playing || isRolling) return

    setIsRolling(true)
    playSound('dice')

    // Simulate dice rolling animation
    const rollSequence = Array.from({ length: 10 }, () => Math.floor(Math.random() * 6) + 1)
    
    for (let i = 0; i < rollSequence.length; i++) {
      dispatch({ type: 'SET_DICE_VALUE', payload: rollSequence[i] })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Final dice value
    const finalDice = Math.floor(Math.random() * 6) + 1
    dispatch({ type: 'SET_DICE_VALUE', payload: finalDice })

    setTimeout(() => {
      if (finalDice === 1) {
        // Player loses current score and turn switches
        dispatch({ type: 'RESET_CURRENT_SCORE' })
        dispatch({ type: 'SWITCH_PLAYER' })
      } else {
        // Add to current score
        dispatch({ type: 'ADD_TO_CURRENT_SCORE', payload: finalDice })
      }
      setIsRolling(false)
    }, 300)
  }

  const holdScore = () => {
    if (!gameState.playing || isRolling) return

    playSound('hold')
    dispatch({ type: 'HOLD_SCORE' })

    // Check if game is won
    const newScore = gameState.scores[gameState.activePlayer] + gameState.currentScores[gameState.activePlayer]
    if (newScore >= 100) {
      playSound('win')
    } else {
      dispatch({ type: 'SWITCH_PLAYER' })
    }
  }

  const updateMultiplayerState = (newState) => {
    dispatch({ type: 'UPDATE_MULTIPLAYER_STATE', payload: newState })
  }

  const value = {
    gameState,
    isRolling,
    newGame,
    rollDice,
    holdScore,
    updateMultiplayerState
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}