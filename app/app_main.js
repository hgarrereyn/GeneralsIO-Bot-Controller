/************************
 * Controller Selection *
 * ---------------------*/
 var ControllerClass = require('./ai/random_controller.js');
/************************/

//TODO: Create a GUI for controller class selection


// Load interface
var Interface = require('./interface.js');

// Load gui modules (initialized immediately)
var gui_comp = require('./gui_components.js');

//Load init method for ai_components
var initAIComponents = require('./ai_components.js');
var ai_comp = {};

// Create interface instance
var i = new Interface(gui_comp.logger, gui_comp.params, gui_comp.viewer);

$(document).ready(function() {
	//Connect to generals.io
	i.connect();

	// Called before the game starts -> recreates the ai_components
	i.preGameStart(function () {

		ai_comp = initAIComponents(function () {
			// This function should return a controller class
			return ControllerClass;
		}, i, gui_comp);

		// Register game callbacks to this controller
		i.registerController(ai_comp.controller);

	});

	$('#join_custom_game').click(function () {
		//Check if we're already in a game
		if (gui_comp.params.inQueue || gui_comp.params.inGame) return;

		var user_id = $('#entry_user_id').val();
		var game_id = $('#entry_game_id').val();

		i.joinCustom(user_id, game_id);
	});

	$('#leave_custom_game').click(function () {
		if (gui_comp.params.inQueue) {
			i.leaveQueue();
		} else if (gui_comp.params.inGame) {
			i.leaveGame();
		}
	});
});
