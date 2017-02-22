
// AI components are initialized after first game update.
//
// Parameters:
//   ControllerClass -> a function that returns the controller object
//   i -> the generals.io interface object
//   gui_comp -> the gui components
//
var initAIComponents = function (ControllerClass, iface, gui_comp) {
	var ai_comp = {};

	//Handles the action queue
	ai_comp.mover = {
		// tracks moves
		queue: [],
		attackIndex: 0,

		getQueue: () => queue,

		addMove: (move) => {
			ai_comp.mover.queue += move;
			ai_comp.mover.attackIndex += 1;
			iface.attack(move);
		},

		clearQueue: () => {
			ai_comp.mover.attackIndex -= ai_comp.mover.queue.length;
			ai_comp.mover.queue = [];
			iface.clearMoves();
		},

		cancelMove: () => {
			ai_comp.mover.attackIndex -= ai_comp.mover.queue.length;
			ai_comp.mover.queue = a.splice(-1,1);
			iface.cancelMove();
		}
	}

	//Handles helper functions
	ai_comp.helper = {

		// True if A and B are next to eachother (not diagonal):
		//
		// . B .
		// B A B
		// . B .
		isNextTo: (a, b, m_width) => ((a == b + m_width || b == a + m_width) || ((a == b + 1 || b == a + 1) && Math.floor(a) == Math.floor(b))),

		/* Written by Victor Zhou as part of the bot tutorial */
		patch: (old, diff) => {
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
		},

		// Returns a list of tiles controlled by the player with pIndex
		fetchControlled: (map, pIndex) => {
			var w = map[0];
			var h = map[1];
			var s = w * h;

			var controlled = [];

			for (i = 2 + s; i < 2 + s + s; ++i) {
				if (map[i] == pIndex)
					controlled.push(i - (2 + s));
			}

			return controlled;
		},

		// Returns one random element from a list
		pickRandom: l => l[Math.floor(Math.random() * l.length)],

		// Returns adjacent tiles to v
		fetchAdjacent: (v, w, h) => {
			var deltas = [-1, 1, w, -w];
			var adjacent = deltas.map(d => v+d);
			return adjacent.filter(u => ai_comp.helper.isInBounds(u, w, h));
		},

		// True when v is in the bounds of the map
		isInBounds: (v, w, h) => (v >= 0 && v <= w * h)

	}

	ai_comp.controller = new (ControllerClass())(gui_comp.logger, ai_comp.mover, ai_comp.helper);

	return ai_comp;
}

module.exports = initAIComponents;
