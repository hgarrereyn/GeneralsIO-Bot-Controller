const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
	// Create the browser window.
	win = new BrowserWindow({
		width: 1000,
		height: 600,
		titleBarStyle: 'hidden-inset',
		transparent: true,
		frame: false
	});

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'app/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	win.on('closed', function () {
		win = null
	});
}

//Create the window-all-closed
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	app.quit();
});
