var Interface = require('./interface.js');

var game = {};

game.logger = {
	log: function (text) {
		console.log(text);

		$('#console').append('<p>' + text + '</p>');
		$('#console').prop('scrollTop', $('#console').prop('scrollHeight'));
	}
};

game.params = {
	inQueue: false,
	inGame: false,

	//Value params

	setStatus: (v) => $('#param_status').text(v),
	setUsername: (v) => $('#param_username').text(v),
	setUserID: (v) => $('#param_user_id').text(v),
	setGameID: (v) => $('#param_game_id').text(v),
	setGameType: (v) => $('#param_game_type').text(v),
	clearParams: () => {
		$('#param_username').text('');
		$('#param_user_id').text('');
		$('#param_game_id').text('');
		$('#param_game_type').text('');
		$('#param_queue').text('');
	},

	//Queue params

	//from 'queue_update' message
	updateQueue: (data) => {
		$('#param_queue').text('');

		var usernames = data.usernames;
		var i = data.playerIndex;

		for (var u in usernames) {
			var e = $('<div class="title_param '+(i==u?'selected':'')+'"><span class="title">#'+u+'</span><span class="value">'+usernames[u]+'</span></div>');
			$('#param_queue').append(e);
		}
	},

	//Helper functions

	joinedQueue: () => {
		game.params.inQueue = true;
		$("#join_custom_game").addClass('button-disabled');
		$("#leave_custom_game").removeClass('button-disabled');

		game.params.setStatus('In Queue');
	},

	joinedGame: () => {
		game.params.inQueue = false;
		game.params.inGame = true;
		$("#leave_custom_game").text("Quit Game");

		game.params.setStatus('In Game');
	},

	//called when user left queue or game
	leftQueueGame: () => {
		game.params.inQueue = false;
		game.params.inGame = false;

		$("#join_custom_game").removeClass('button-disabled');
		$("#leave_custom_game").addClass('button-disabled');
		$("#leave_custom_game").text("Leave Queue");

		game.params.clearParams();
		game.params.setStatus('Idle');
	}
};

/*Taken from the tutorial*/
function patch(old, diff) {
	var out = [];
	var i = 0;
	while (i < diff.length) {
		if (diff[i]) {  // matching
			Array.prototype.push.apply(out, old.slice(out.length, out.length + diff[i]));
		}
		i++;
		if (i < diff.length && diff[i]) {  // mismatching
			Array.prototype.push.apply(out, diff.slice(i + 1, i + 1 + diff[i]));
			i += diff[i];
		}
		i++;
	}
	return out;
}

game.viewer = {
	scores: {},
	cities: [],
	map: [],
	generals: [],

	terrainConst: {
		'-1': 'tile_empty',
		'-2': 'tile_mountain',
		'-3': 'tile_fog',
		'-4': 'tile_obstacle'
	},

	hasMap: false,

	setUsernames: (usernames) => {
		game.viewer.scores = {};

		//clear scoreboard
		$('#viewer_scores tbody').html('<tr><td>Stars</td><td>Player</td><td>Army</td><td>Land</td></tr>');

		for (var u in usernames) {
			game.viewer.scores[u] = {
				stars: '',
				player: usernames[u],
				army: 0,
				land: 0,
				dead: false
			};

			var row = '<tr><td id="stars_'+u+'">?</td><td id="player_'+u+'">'+usernames[u]+'</td><td id="army_'+u+'">0</td><td id="land_'+u+'">0</td></tr>';

			$('#viewer_scores tbody')[0].innerHTML += (row);
		}

	},

	setStars: (stars) => {
		for (var i in stars) {
			$('#viewer_scores #stars_' + i).text(stars[i]);

			game.viewer.scores[i].stars = stars[i];
		}
	},

	updateScores: (scores) => {
		for (var i in scores) {
			$('#viewer_scores #army_' + i).text(scores[i].total);
			$('#viewer_scores #land_' + i).text(scores[i].tiles);

			game.viewer.scores[i].army = scores[i].total;
			game.viewer.scores[i].land = scores[i].tiles;
		}
	},

	showScores: () => {
		$('#viewer_scores').show();
		$('#viewer_map').show();
	},

	hideScores: () => {
		$('#viewer_scores').hide();
		$('#viewer_map').hide();
	},

	processUpdate: (data) => {
		game.viewer.cities = patch(game.viewer.cities, data.cities_diff);
		game.viewer.map = patch(game.viewer.map, data.map_diff);
		game.viewer.generals = data.generals;

		var width = game.viewer.map[0];
		var height = game.viewer.map[1];

		if (!game.viewer.hasMap) {
			game.viewer.initializeMap();
			game.viewer.hasMap = true;
			game.logger.log('Dimensions: ' + width + ' by ' + height);
		}

		for (var i = 2; i < (width * height) + 2; ++i) {
			var tile = i - 2;

			$('#viewer_map #tile_' + tile).text(game.viewer.map[i]);
		}

		for (var i = 2 + (width * height); i <= (width * height * 2) + 2; ++i) {
			var tile = i - 2 - (width * height);

			$('#viewer_map #tile_' + tile).attr('class','');

			if (game.viewer.map[i] < 0 && game.viewer.map[i] >= -4)
				$('#viewer_map #tile_' + tile).addClass(game.viewer.terrainConst[game.viewer.map[i] + '']);

			if (game.viewer.map[i] >= 0) {
				$('#viewer_map #tile_' + tile).addClass('tile_p' + game.viewer.map[i]);
			}
		}

		for (var i in game.viewer.cities) {
			$('#viewer_map #tile_' + game.viewer.cities[i]).addClass('tile_city');
		}

		for (var i in game.viewer.generals) {
			$('#viewer_map #tile_' + game.viewer.generals[i]).addClass('tile_general');
		}
	},

	initializeMap: () => {
		$('#viewer_map tbody').html('');

		var width = game.viewer.map[0];
		var height = game.viewer.map[1];

		for (var row = 0; row < height; ++row) {

			var rowString = '<tr>';

			for (var col = 0; col < width; ++col) {
				rowString += '<td id="tile_'+(row*width + col)+'">0</td>';
			}

			rowString += '</tr>';

			$('#viewer_map tbody')[0].innerHTML += rowString;
		}
	}
}

game.controller = {};

var i = new Interface(game.logger, game.params, game.viewer, game.controller);

$(document).ready(function() {
	i.connect();

	$('#join_custom_game').click(function () {
		//Check if we're already in a game
		if (game.params.inQueue || game.params.inGame) return;

		var user_id = $('#entry_user_id').val();
		var game_id = $('#entry_game_id').val();

		i.joinCustom(user_id, game_id);
	});

	$('#leave_custom_game').click(function () {
		if (game.params.inQueue) {
			i.leaveQueue();
		} else if (game.params.inGame) {
			i.leaveGame();
		}
	})
});



module.exports = game;
