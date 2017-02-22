var gui_comp = {};

//Handles logging mechanisms
gui_comp.logger = {
	log: function (text) {
		console.log(text);

		$('#console').append('<p>' + text + '</p>');
		$('#console').prop('scrollTop', $('#console').prop('scrollHeight'));
	},

	warn: function (text) {
		console.warn(text);

		$('#console').append('<p class="warn">' + text + '</p>');
		$('#console').prop('scrollTop', $('#console').prop('scrollHeight'));
	},
};

//Handles queue and game parameters
gui_comp.params = {
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
		gui_comp.params.inQueue = true;
		$("#join_custom_game").addClass('button-disabled');
		$("#leave_custom_game").removeClass('button-disabled');

		gui_comp.params.setStatus('In Queue');
	},

	joinedGame: () => {
		gui_comp.params.inQueue = false;
		gui_comp.params.inGame = true;
		$("#leave_custom_game").text("Quit Game");

		gui_comp.params.setStatus('In Game');
	},

	//called when user left queue or game
	leftQueueGame: () => {
		gui_comp.params.inQueue = false;
		gui_comp.params.inGame = false;

		$("#join_custom_game").removeClass('button-disabled');
		$("#leave_custom_game").addClass('button-disabled');
		$("#leave_custom_game").text("Leave Queue");

		gui_comp.params.clearParams();
		gui_comp.params.setStatus('Idle');
	}
};

/* Written by Victor Zhou */
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

//Handles map, scores and gameplay elements
gui_comp.viewer = {
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
		gui_comp.viewer.scores = {};

		//clear scoreboard
		$('#viewer_scores tbody').html('<tr><td>Stars</td><td>Player</td><td>Army</td><td>Land</td></tr>');

		for (var u in usernames) {
			gui_comp.viewer.scores[u] = {
				stars: '',
				player: usernames[u],
				army: 0,
				land: 0,
				dead: false
			};

			var row = '<tr class="player'+u+'"><td id="stars_'+u+'">?</td><td id="player_'+u+'">'+usernames[u]+'</td><td id="army_'+u+'">0</td><td id="land_'+u+'">0</td></tr>';

			$('#viewer_scores tbody')[0].innerHTML += (row);
		}

	},

	setStars: (stars) => {
		for (var i in stars) {
			$('#viewer_scores #stars_' + i).text(stars[i]);

			gui_comp.viewer.scores[i].stars = stars[i];
		}
	},

	updateScores: (scores) => {
		for (var i in scores) {
			$('#viewer_scores #army_' + i).text(scores[i].total);
			$('#viewer_scores #land_' + i).text(scores[i].tiles);

			gui_comp.viewer.scores[i].army = scores[i].total;
			gui_comp.viewer.scores[i].land = scores[i].tiles;
		}
	},

	showScores: () => {
		$('#viewer_scores').show();
		$('#viewer_map').show();
	},

	hideScores: () => {
		$('#viewer_scores').hide();
		$('#viewer_map').hide();
		gui_comp.viewer.hasMap = false;
	},

	processUpdate: (data) => {
		//Patch diffs
		gui_comp.viewer.cities = patch(gui_comp.viewer.cities, data.cities_diff);
		gui_comp.viewer.map = patch(gui_comp.viewer.map, data.map_diff);
		gui_comp.viewer.generals = data.generals;

		var width = gui_comp.viewer.map[0];
		var height = gui_comp.viewer.map[1];

		//Render map if it is the first update
		if (!gui_comp.viewer.hasMap) {
			gui_comp.viewer.initializeMap();
			gui_comp.viewer.hasMap = true;
			gui_comp.logger.log('Dimensions: ' + width + ' by ' + height);
		}

		//Set army numbers
		for (var i = 2; i < (width * height) + 2; ++i) {
			var tile = i - 2;

			$('#viewer_map #tile_' + tile).text(gui_comp.viewer.map[i]);
		}

		//Set terrain classes
		for (var i = 2 + (width * height); i <= (width * height * 2) + 2; ++i) {
			var tile = i - 2 - (width * height);

			$('#viewer_map #tile_' + tile).attr('class','');

			if (gui_comp.viewer.map[i] < 0 && gui_comp.viewer.map[i] >= -4)
				$('#viewer_map #tile_' + tile).addClass(gui_comp.viewer.terrainConst[gui_comp.viewer.map[i] + '']);

			if (gui_comp.viewer.map[i] >= 0) {
				$('#viewer_map #tile_' + tile).addClass('tile_p' + gui_comp.viewer.map[i]);
			}
		}

		//Place cities
		for (var i in gui_comp.viewer.cities) {
			$('#viewer_map #tile_' + gui_comp.viewer.cities[i]).addClass('tile_city');
		}

		//Place generals
		for (var i in gui_comp.viewer.generals) {
			$('#viewer_map #tile_' + gui_comp.viewer.generals[i]).addClass('tile_general');
		}
	},

	initializeMap: () => {
		$('#viewer_map tbody').html('');

		var width = gui_comp.viewer.map[0];
		var height = gui_comp.viewer.map[1];

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

module.exports = gui_comp;
