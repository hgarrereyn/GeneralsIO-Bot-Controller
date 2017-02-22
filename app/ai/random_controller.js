/*
 A controller that makes random moves into open or owned territory
 */
var RandomController = function (logger, mover, helper) {

	this.title = 'Random Controller';
	this.description = 'Makes random moves';

	this.map = [];
	this.cities = [];
	this.generals = [];

	this.gameStart = function (data) {
		this.playerIndex = data.playerIndex;
	}

	this.gameUpdate = function (data) {
		//Apply diffs
		this.map = helper.patch(this.map, data.map_diff);
		this.cities = helper.patch(this.cities, data.cities_diff);
		this.generals = data.generals;

		//Map params
		var w = this.map[0];
		var h = this.map[1];
		var s = w * h;

		//Fetch controlled tiles
		var controlled = helper.fetchControlled(this.map, this.playerIndex);

		//Select the tiles we can move (army > 1)
		var moveable = controlled.filter(i => this.map[i + 2] > 1);

		//Pick a random tile
		var source = helper.pickRandom(moveable);

		//Fetch adjacent tiles
		var adjacent = helper.fetchAdjacent(source, w, h);

		//Select the tiles that are empty or owned by us
		var targets = adjacent.filter(i => this.map[i + 2 + s] == this.playerIndex || this.map[i + 2 + s] == -1);

		//If we have targets,
		if (targets.length > 0) {
			//Pick one
			var target = helper.pickRandom(targets);

			//Queue the move
			mover.addMove([source, target, false]);
		} else {
			return;
		}

	}
}

module.exports = RandomController;
