import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './gameManager.js';
import { PlayerManager } from './playerManager.js';

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

// Managers
const gameManager = new GameManager();
const playerManager = new PlayerManager();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/api/games', (req, res) => {
  res.json(gameManager.getAllGames());
});

app.get('/api/players', (req, res) => {
  res.json(playerManager.getAllPlayers());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Player joins with unique ID
  socket.on('join_lobby', (playerData) => {
    const player = playerManager.addPlayer(socket.id, playerData.playerId, playerData.playerName);
    socket.playerId = player.id;
    socket.playerName = player.name;
    
    socket.join('lobby');
    
    // Send updated player list to all clients in lobby
    io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    
    socket.emit('join_success', player);
    console.log(`Player ${player.name} (${player.id}) joined lobby`);
  });

  // Player requests to play with another player
  socket.on('request_game', (targetPlayerId) => {
    const requester = playerManager.getPlayer(socket.playerId);
    const target = playerManager.getPlayerById(targetPlayerId);
    
    if (!requester || !target) {
      socket.emit('error', 'Player not found');
      return;
    }

    if (requester.status !== 'lobby' || target.status !== 'lobby') {
      socket.emit('error', 'One or both players are not available');
      return;
    }

    // Send game request to target player
    const targetSocket = playerManager.getSocketId(targetPlayerId);
    if (targetSocket) {
      io.to(targetSocket).emit('game_request', {
        from: requester.id,
        fromName: requester.name
      });
    }
  });

  // Player accepts game request
  socket.on('accept_game', (requesterId) => {
    const accepter = playerManager.getPlayer(socket.playerId);
    const requester = playerManager.getPlayerById(requesterId);
    
    if (!accepter || !requester) {
      socket.emit('error', 'Player not found');
      return;
    }

    // Create new game
    const game = gameManager.createGame(requester, accepter);
    
    // Update player statuses
    playerManager.updatePlayerStatus(requester.id, 'playing', game.id);
    playerManager.updatePlayerStatus(accepter.id, 'playing', game.id);
    
    // Join game room
    const requesterSocket = playerManager.getSocketId(requesterId);
    socket.join(game.id);
    io.sockets.sockets.get(requesterSocket)?.join(game.id);
    
    // Leave lobby
    socket.leave('lobby');
    io.sockets.sockets.get(requesterSocket)?.leave('lobby');
    
    // Start game
    io.to(game.id).emit('game_started', game);
    io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    
    console.log(`Game started: ${game.id} between ${requester.name} and ${accepter.name}`);
  });

  // Player declines game request
  socket.on('decline_game', (requesterId) => {
    const decliner = playerManager.getPlayer(socket.playerId);
    const requesterSocket = playerManager.getSocketId(requesterId);
    
    if (requesterSocket) {
      io.to(requesterSocket).emit('game_declined', {
        by: decliner.name
      });
    }
  });

  // Player wants to watch a game
  socket.on('watch_game', (gameId) => {
    const game = gameManager.getGame(gameId);
    const player = playerManager.getPlayer(socket.playerId);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (player.status !== 'lobby') {
      socket.emit('error', 'You must be in lobby to watch games');
      return;
    }

    // Update player status to watching
    playerManager.updatePlayerStatus(player.id, 'watching', gameId);
    
    // Join game room as spectator
    socket.join(gameId);
    socket.leave('lobby');
    
    // Send current game state
    socket.emit('watching_game', game);
    io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    
    console.log(`${player.name} is now watching game ${gameId}`);
  });

  // Game actions
  socket.on('roll_dice', (gameId) => {
    const game = gameManager.getGame(gameId);
    const player = playerManager.getPlayer(socket.playerId);
    
    if (!game || !player) return;
    
    if (game.currentPlayer !== player.id || !game.playing) {
      socket.emit('error', 'Not your turn or game not active');
      return;
    }

    const result = gameManager.rollDice(gameId);
    io.to(gameId).emit('dice_rolled', result);
    
    if (result.switchPlayer) {
      io.to(gameId).emit('player_switched', game);
    }
    
    if (result.gameOver) {
      // Game ended
      const winner = result.winner;
      io.to(gameId).emit('game_ended', { winner, game });
      
      // Reset players to lobby
      game.players.forEach(playerId => {
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
      
      // Reset watchers to lobby
      game.watchers.forEach(watcherId => {
        const w = playerManager.getPlayerById(watcherId);
        if (w) {
          playerManager.updatePlayerStatus(watcherId, 'lobby');
          const socketId = playerManager.getSocketId(watcherId);
          if (socketId) {
            io.sockets.sockets.get(socketId)?.join('lobby');
            io.sockets.sockets.get(socketId)?.leave(gameId);
          }
        }
      });
      
      gameManager.endGame(gameId);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    }
  });

  socket.on('hold_score', (gameId) => {
    const game = gameManager.getGame(gameId);
    const player = playerManager.getPlayer(socket.playerId);
    
    if (!game || !player) return;
    
    if (game.currentPlayer !== player.id || !game.playing) {
      socket.emit('error', 'Not your turn or game not active');
      return;
    }

    const result = gameManager.holdScore(gameId);
    io.to(gameId).emit('score_held', result);
    
    if (result.gameOver) {
      // Game ended
      const winner = result.winner;
      io.to(gameId).emit('game_ended', { winner, game });
      
      // Reset players to lobby
      game.players.forEach(playerId => {
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
      
      // Reset watchers to lobby
      game.watchers.forEach(watcherId => {
        const w = playerManager.getPlayerById(watcherId);
        if (w) {
          playerManager.updatePlayerStatus(watcherId, 'lobby');
          const socketId = playerManager.getSocketId(watcherId);
          if (socketId) {
            io.sockets.sockets.get(socketId)?.join('lobby');
            io.sockets.sockets.get(socketId)?.leave(gameId);
          }
        }
      });
      
      gameManager.endGame(gameId);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    } else {
      io.to(gameId).emit('player_switched', game);
    }
  });

  // Player leaves game/stops watching
  socket.on('leave_game', () => {
    const player = playerManager.getPlayer(socket.playerId);
    if (!player) return;
    
    if (player.status === 'playing' && player.gameId) {
      // Player is in a game - end the game
      const game = gameManager.getGame(player.gameId);
      if (game) {
        io.to(player.gameId).emit('player_left', { 
          player: player.name,
          gameEnded: true 
        });
        
        // Reset all players in game to lobby
        game.players.forEach(playerId => {
          const p = playerManager.getPlayerById(playerId);
          if (p && p.id !== player.id) {
            playerManager.updatePlayerStatus(playerId, 'lobby');
            const socketId = playerManager.getSocketId(playerId);
            if (socketId) {
              io.sockets.sockets.get(socketId)?.join('lobby');
              io.sockets.sockets.get(socketId)?.leave(player.gameId);
            }
          }
        });
        
        gameManager.endGame(player.gameId);
      }
    } else if (player.status === 'watching' && player.gameId) {
      // Player is watching - just remove from watchers
      socket.leave(player.gameId);
    }
    
    // Reset player to lobby
    playerManager.updatePlayerStatus(player.id, 'lobby');
    socket.join('lobby');
    
    io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const player = playerManager.getPlayer(socket.playerId);
    if (player) {
      console.log(`Player ${player.name} (${player.id}) disconnected`);
      
      if (player.status === 'playing' && player.gameId) {
        // Player was in a game - notify other player and end game
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
      }
      
      playerManager.removePlayer(socket.playerId);
      io.to('lobby').emit('players_update', playerManager.getLobbyPlayers());
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});