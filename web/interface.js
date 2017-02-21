var io = require('socket.io-client');

// Wrapper class for socket methods
//
// Callback classes:
//   logger -> abstract the logging mechanism
//   params -> set text or value params (eg. username, rank, troop count, round number ...)
//   viewer -> set values for the visualization of the game screen
var Interface = function (logger, params, viewer, controller) {

	//Reference values
	this.socket = undefined;
	this.isConnected = false;

	//Game status
	this.inQueue = false;
	this.inGame = false;

	this.logger = logger;
	this.params = params;
	this.viewer = viewer;
	this.controller = controller;

	//Connect to the bot server
	this.connect = function () {

		//Check if we're already connected
		if (this.isConnected)
			return;

		logger.log("Connecting...");

		this.socket = io('http://botws.generals.io');

		// -- //

		var that = this; //ref

		this.socket.on('connect', function () {
			that.isConnected = true;
			logger.log("Connected to server");
		});

		this.socket.on('disconnect', function () {
			that.isConnected = false;
			logger.log("Disconnected from server");
		})
	}

	//Join a private match
	this.joinCustom = function (user_id, custom_game_id) {
		if (!this.isConnected)
			return;

		logger.log("Joining a private match...");
		logger.log("  User ID: " + user_id);
		logger.log("  Game ID: " + custom_game_id);

		this.socket.emit('join_private', custom_game_id, user_id);
		this.socket.emit('set_force_start', custom_game_id, true);
		logger.log('Joined custom game at http://bot.generals.io/games/' + encodeURIComponent(custom_game_id));

		//ref
		var that = this;

		//Set up the controller and register callbacks
		//controller.setMode('custom');
		//controller.setSocket(this.socket);

		this.socket.on('queue_update', function (data) {
			if (!that.inQueue) {
				that.inQueue = true;
				that.params.joinedQueue();
			}

			that.params.updateQueue(data);
		});

		this.socket.on('pre_game_start', function () {
			that.inQueue = false;
			that.inGame = true;
			that.params.joinedGame();
		});

		//Param callbacks
		this.socket.on('game_start', function (data) {
			var playerIndex = data.playerIndex;
			var usernames = data.usernames;
			var playerUsername = usernames[playerIndex];

			logger.log("Game started");
			for (var i in usernames)
				logger.log(" " + (i == playerUsername ? "*" : " ") + usernames[i]);

			that.params.setUsername(playerUsername);
			that.params.setGameID(custom_game_id);
			that.params.setUserID(user_id);
			that.params.setGameType("Custom Game");

			//sets usernames and initializes scoreboard
			that.viewer.setUsernames(usernames);
			that.viewer.showScores();

			//controller.gameStart();
		});

		this.socket.on('game_update', function (data) {
			if (data.stars != undefined)
				that.viewer.setStars(data.stars);

			viewer.updateScores(data.scores);

			viewer.processUpdate(data);
		});

		//this.socket.on('game_lost', controller.lost);
		//this.socket.on('game_won', controller.won);
	}

	this.leaveQueue = function () {
		if (this.inQueue) {
			logger.log("Leaving queue");
			this.socket.emit('cancel');
			this.inQueue = false;
			this.params.leftQueueGame();
		}
	}

	this.leaveGame = function () {
		if (this.inGame) {
			logger.log("Leaving game");
			this.socket.emit('leave_game');
			this.inGame = false;
			this.params.leftQueueGame();
			this.viewer.hideScores();
		}
	}
}

//exports
module.exports = Interface;
