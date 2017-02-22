// Available modules:
//   logger -> log messages
//   mover -> add/view/clear move queue
//   helper -> utility functions for map data
var TemplateController = function (logger, mover, helper) {

	this.title = 'Title';
	this.description = 'Description';

	// Called once on the `game_start` message
	this.gameStart = function (data) {

	}

	// Called every `game_update` message
	this.gameUpdate = function (data) {

	}
}

// Export the class
module.exports = TemplateController;
