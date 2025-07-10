import React, { createContext, useContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useGame } from './GameContext'
import { useSound } from './SoundContext'

const MultiplayerContext = createContext()

export function MultiplayerProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInLobby, setIsInLobby] = useState(false)
  const [playerInfo, setPlayerInfo] = useState(null)
  const [lobbyPlayers, setLobbyPlayers] = useState([])
  const [activeGames, setActiveGames] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [gameData, setGameData] = useState(null)
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false)
  const [isSpectating, setIsSpectating] = useState(false)
  const [pendingRequest, setPendingRequest] = useState(null)

  const { updateMultiplayerState } = useGame()
  const { playSound, playMusic } = useSound()

  const connectToLobby = ({ playerName, playerId, avatar }) => {
    const newSocket = io(window.location.origin)
    
    newSocket.on('connect', () => {
      setIsConnected(true)
      setSocket(newSocket)
      
      newSocket.emit('join_lobby', {
        playerName,
        playerId,
        avatar
      })
    })

    newSocket.on('join_success', (player) => {
      setPlayerInfo(player)
      setIsInLobby(true)
      fetchLeaderboard()
      playMusic()
    })

    newSocket.on('players_update', (players) => {
      setLobbyPlayers(players.filter(p => p.id !== playerInfo?.id))
    })

    newSocket.on('games_update', (games) => {
      setActiveGames(games)
    })

    newSocket.on('game_request', (data) => {
      setPendingRequest(data)
      if (window.confirm(`${data.fromName} (${data.from}) wants to play with you! Accept?`)) {
        acceptGameRequest(data.from)
      } else {
        declineGameRequest(data.from)
      }
    })

    newSocket.on('game_declined', (data) => {
      alert(`${data.by} declined your game request`)
    })

    newSocket.on('game_started', (game) => {
      startMultiplayerGame(game)
    })

    newSocket.on('watching_game', (game) => {
      startWatchingGame(game)
    })

    newSocket.on('dice_rolled', (result) => {
      handleDiceRoll(result)
    })

    newSocket.on('score_held', (result) => {
      handleScoreHeld(result)
    })

    newSocket.on('game_ended', (data) => {
      handleGameEnd(data)
      fetchLeaderboard()
    })

    newSocket.on('player_left', (data) => {
      alert(`${data.player} left the game`)
      if (data.gameEnded) {
        returnToLobby()
      }
    })

    newSocket.on('player_disconnected', (data) => {
      alert(`${data.player} disconnected`)
      returnToLobby()
    })

    newSocket.on('error', (message) => {
      alert('Error: ' + message)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      alert('Disconnected from server')
    })
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      const data = await response.json()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  const requestGame = (targetPlayerId) => {
    if (socket && isConnected) {
      socket.emit('request_game', targetPlayerId)
    }
  }

  const acceptGameRequest = (requesterId) => {
    if (socket) {
      socket.emit('accept_game', requesterId)
    }
    setPendingRequest(null)
  }

  const declineGameRequest = (requesterId) => {
    if (socket) {
      socket.emit('decline_game', requesterId)
    }
    setPendingRequest(null)
  }

  const watchGame = (gameId) => {
    if (socket && isConnected) {
      socket.emit('watch_game', gameId)
    }
  }

  const startMultiplayerGame = (game) => {
    setGameData(game)
    setIsMultiplayerMode(true)
    setIsSpectating(false)
    setIsInLobby(false)
    updateGameUI(game)
  }

  const startWatchingGame = (game) => {
    setGameData(game)
    setIsMultiplayerMode(true)
    setIsSpectating(true)
    setIsInLobby(false)
    updateGameUI(game)
  }

  const updateGameUI = (game) => {
    const player1Id = game.players[0]
    const player2Id = game.players[1]

    updateMultiplayerState({
      scores: [game.scores[player1Id], game.scores[player2Id]],
      currentScores: [game.currentScores[player1Id], game.currentScores[player2Id]],
      activePlayer: game.players.indexOf(game.currentPlayer),
      playing: game.playing,
      playerNames: [game.playerNames[player1Id], game.playerNames[player2Id]]
    })
  }

  const handleDiceRoll = async (result) => {
    playSound('dice')
    
    // Update game state
    setGameData(result.game)
    updateGameUI(result.game)

    // Show dice animation if sequence provided
    if (result.diceSequence) {
      for (let i = 0; i < result.diceSequence.length; i++) {
        updateMultiplayerState({ diceValue: result.diceSequence[i] })
        await new Promise(resolve => setTimeout(resolve, 80))
      }
    }

    // Show final dice
    updateMultiplayerState({ diceValue: result.dice })
  }

  const handleScoreHeld = (result) => {
    playSound('hold')
    setGameData(result.game)
    updateGameUI(result.game)
  }

  const handleGameEnd = (data) => {
    playSound('win')
    
    if (data.winner) {
      updateMultiplayerState({
        winner: gameData.players.indexOf(data.winner.id),
        playing: false,
        showConfetti: true
      })
    }

    setTimeout(() => {
      returnToLobby()
    }, 3000)
  }

  const rollDiceMultiplayer = () => {
    if (socket && gameData && isMyTurn() && gameData.playing) {
      socket.emit('roll_dice', {
        gameId: gameData.id,
        playerId: playerInfo.id
      })
    }
  }

  const holdScoreMultiplayer = () => {
    if (socket && gameData && isMyTurn() && gameData.playing) {
      socket.emit('hold_score', gameData.id)
    }
  }

  const isMyTurn = () => {
    return gameData && gameData.currentPlayer === playerInfo?.id
  }

  const leaveGame = () => {
    if (socket) {
      socket.emit('leave_game')
    }
    returnToLobby()
  }

  const returnToLobby = () => {
    setGameData(null)
    setIsMultiplayerMode(false)
    setIsSpectating(false)
    setIsInLobby(true)
    
    // Reset game state to single player
    updateMultiplayerState({
      scores: [0, 0],
      currentScores: [0, 0],
      activePlayer: 0,
      playing: true,
      winner: null,
      playerNames: ['Player 1', 'Player 2'],
      showConfetti: false
    })
  }

  const value = {
    socket,
    isConnected,
    isInLobby,
    playerInfo,
    lobbyPlayers,
    activeGames,
    leaderboard,
    gameData,
    isMultiplayerMode,
    isSpectating,
    pendingRequest,
    connectToLobby,
    requestGame,
    acceptGameRequest,
    declineGameRequest,
    watchGame,
    rollDiceMultiplayer,
    holdScoreMultiplayer,
    isMyTurn,
    leaveGame,
    returnToLobby
  }

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  )
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext)
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider')
  }
  return context
}