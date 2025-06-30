import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './managers/gameManager.js';
import { PlayerManager } from './managers/playerManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize managers
const gameManager = new GameManager();
const playerManager = new PlayerManager();

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

app.get('/api/games', (req, res) => {
  res.json(gameManager.getAllGames());
});

app.get('/api/players', (req, res) => {
  res.json(playerManager.getLobbyPlayers());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`\nPlayer connected: ${socket.id}`);

  // Player joins lobby
  socket.on('join_lobby', (playerData) => {
    try {
      const player = playerManager.addPlayer(socket.id, playerData.playerId, playerData.playerName);
      socket.playerId = player.id;
      socket.join('lobby');
      
      socket.emit('join_success', player);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
      io.to('lobby').emit('games_update', gameManager.getAllGames());
      
      console.log(`${player.name} (${player.id}) joined lobby\n`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Player requests game with another player
  socket.on('request_game', (targetPlayerId) => {
    try {
      const requester = playerManager.getPlayer(socket.id);
      const target = playerManager.getPlayerById(targetPlayerId);
      
      if (!requester || !target) {
        socket.emit('error', 'Player not found');
        return;
      }

      if (requester.status !== 'lobby' || target.status !== 'lobby') {
        socket.emit('error', 'One or both players are not available');
        return;
      }

      const targetSocketId = playerManager.getSocketId(targetPlayerId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('game_request', {
          from: requester.id,
          fromName: requester.name
        });
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Player accepts game request
  socket.on('accept_game', (requesterId) => {
    try {
      const accepter = playerManager.getPlayer(socket.id);
      const requester = playerManager.getPlayerById(requesterId);
      
      if (!accepter || !requester) {
        socket.emit('error', 'Player not found');
        return;
      }

      const game = gameManager.createGame(requester, accepter);
      
      // Update player statuses
      playerManager.updatePlayerStatus(requester.id, 'playing', game.id);
      playerManager.updatePlayerStatus(accepter.id, 'playing', game.id);
      
      // Join game room
      const requesterSocketId = playerManager.getSocketId(requesterId);
      socket.join(game.id);
      io.sockets.sockets.get(requesterSocketId)?.join(game.id);
      
      // Leave lobby
      socket.leave('lobby');
      io.sockets.sockets.get(requesterSocketId)?.leave('lobby');
      
      // Start game
      io.to(game.id).emit('game_started', game);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
      io.to('lobby').emit('games_update', gameManager.getAllGames());
      
      console.log(`Game ${game.id} started: ${requester.name} vs ${accepter.name}\n`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Player declines game request
  socket.on('decline_game', (requesterId) => {
    const decliner = playerManager.getPlayer(socket.id);
    const requesterSocketId = playerManager.getSocketId(requesterId);
    
    if (requesterSocketId) {
      io.to(requesterSocketId).emit('game_declined', {
        by: decliner?.name || 'Unknown'
      });
    }
  });

  // Player wants to watch a game
  socket.on('watch_game', (gameId) => {
    try {
      const game = gameManager.getGame(gameId);
      const player = playerManager.getPlayer(socket.id);
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      if (!player || player.status !== 'lobby') {
        socket.emit('error', 'You must be in lobby to watch games');
        return;
      }

      playerManager.updatePlayerStatus(player.id, 'watching', gameId);
      gameManager.addWatcher(gameId, player.id);
      
      socket.join(gameId);
      socket.leave('lobby');
      
      socket.emit('watching_game', game);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
      
      console.log(`${player.name} is watching game ${gameId}\n`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Game actions - Roll dice
  socket.on('roll_dice', (gameId) => {
    try {
      const game = gameManager.getGame(gameId);
      const player = playerManager.getPlayer(socket.id);
      
      if (!game || !player) return;
      
      if (game.currentPlayer !== player.id || !game.playing) {
        socket.emit('error', 'Not your turn or game not active');
        return;
      }

      const result = gameManager.rollDice(gameId);
      if (result) {
        io.to(gameId).emit('dice_rolled', result);
        
        if (result.gameOver) {
          handleGameEnd(gameId, result);
        }
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Game actions - Hold score
  socket.on('hold_score', (gameId) => {
    try {
      const game = gameManager.getGame(gameId);
      const player = playerManager.getPlayer(socket.id);
      
      if (!game || !player) return;
      
      if (game.currentPlayer !== player.id || !game.playing) {
        socket.emit('error', 'Not your turn or game not active');
        return;
      }

      const result = gameManager.holdScore(gameId);
      if (result) {
        io.to(gameId).emit('score_held', result);
        
        if (result.gameOver) {
          handleGameEnd(gameId, result);
        }
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Multiplayer New Game Request
  socket.on('new_game_request', ({ gameId }) => {
    try {
      const game = gameManager.getGame(gameId);
      const player = playerManager.getPlayer(socket.id);
      if (!game || !player) return;
      // Find the other player
      const otherPlayerId = game.players.find(pid => pid !== player.id);
      const otherSocketId = playerManager.getSocketId(otherPlayerId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('new_game_request', { from: player.name });
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('accept_new_game', ({ gameId }) => {
    try {
      const game = gameManager.getGame(gameId);
      if (!game) return;
      // Reset game state for both players
      const player1 = playerManager.getPlayerById(game.players[0]);
      const player2 = playerManager.getPlayerById(game.players[1]);
      if (!player1 || !player2) return;
      // End current game and create a new one
      gameManager.endGame(gameId);
      const newGame = gameManager.createGame(player1, player2);
      playerManager.updatePlayerStatus(player1.id, 'playing', newGame.id);
      playerManager.updatePlayerStatus(player2.id, 'playing', newGame.id);
      // Join new game room
      const socket1 = playerManager.getSocketId(player1.id);
      const socket2 = playerManager.getSocketId(player2.id);
      if (socket1) {
        io.sockets.sockets.get(socket1)?.join(newGame.id);
        io.sockets.sockets.get(socket1)?.leave(gameId);
      }
      if (socket2) {
        io.sockets.sockets.get(socket2)?.join(newGame.id);
        io.sockets.sockets.get(socket2)?.leave(gameId);
      }
      // Notify both players
      io.to(newGame.id).emit('game_started', newGame);
      io.to('lobby').emit('games_update', gameManager.getAllGames());
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Player leaves game or stops watching
  socket.on('leave_game', () => {
    try {
      const player = playerManager.getPlayer(socket.id);
      if (!player) return;
      
      if (player.status === 'playing' && player.gameId) {
        const game = gameManager.getGame(player.gameId);
        if (game) {
          io.to(player.gameId).emit('player_left', { 
            player: player.name,
            gameEnded: true 
          });
          
          // Reset other players to lobby
          game.players.forEach(playerId => {
            if (playerId !== player.id) {
              const p = playerManager.getPlayerById(playerId);
              if (p) {
                playerManager.updatePlayerStatus(playerId, 'lobby');
                const socketId = playerManager.getSocketId(playerId);
                if (socketId) {
                  io.sockets.sockets.get(socketId)?.join('lobby');
                  io.sockets.sockets.get(socketId)?.leave(player.gameId);
                }
              }
            }
          });
          
          gameManager.endGame(player.gameId);
        }
      } else if (player.status === 'watching' && player.gameId) {
        gameManager.removeWatcher(player.gameId, player.id);
        socket.leave(player.gameId);
      }
      
      playerManager.updatePlayerStatus(player.id, 'lobby');
      socket.join('lobby');
      
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
      io.to('lobby').emit('games_update', gameManager.getAllGames());
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    try {
      const player = playerManager.getPlayer(socket.id);
      if (player) {
        console.log(`${player.name} (${player.id}) disconnected\n`);
        
        if (player.status === 'playing' && player.gameId) {
          const game = gameManager.getGame(player.gameId);
          if (game) {
            io.to(player.gameId).emit('player_disconnected', { 
              player: player.name 
            });
            
            // Reset other players to lobby
            game.players.forEach(playerId => {
              if (playerId !== player.id) {
                const p = playerManager.getPlayerById(playerId);
                if (p) {
                  playerManager.updatePlayerStatus(playerId, 'lobby');
                  const socketId = playerManager.getSocketId(playerId);
                  if (socketId) {
                    io.sockets.sockets.get(socketId)?.join('lobby');
                  }
                }
              }
            });
            
            gameManager.endGame(player.gameId);
          }
        } else if (player.status === 'watching' && player.gameId) {
          gameManager.removeWatcher(player.gameId, player.id);
        }
        
        playerManager.removePlayer(socket.id);
        io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
        io.to('lobby').emit('games_update', gameManager.getAllGames());
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Helper function to handle game end
  function handleGameEnd(gameId, result) {
    const game = gameManager.getGame(gameId);
    if (!game) return;

    io.to(gameId).emit('game_ended', result);
    
    // Reset all players and watchers to lobby
    [...game.players, ...game.watchers].forEach(playerId => {
      const p = playerManager.getPlayerById(playerId);
      if (p) {
        playerManager.updatePlayerStatus(playerId, 'lobby');
        const socketId = playerManager.getSocketId(playerId);
        if (socketId) {
          io.sockets.sockets.get(socketId)?.join('lobby');
          io.sockets.sockets.get(socketId)?.leave(gameId);
        }
      }
    });
    
    gameManager.endGame(gameId);
    io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    io.to('lobby').emit('games_update', gameManager.getAllGames());
  }
});

server.listen(PORT, () => {
  console.log(`🎲 Pig Game Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});