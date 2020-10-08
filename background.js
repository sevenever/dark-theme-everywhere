!function (global) {
	// Ensure that the default theme is set, defaulting to Dark.
	if (['dark', 'light'].indexOf(global.localStorage.getItem('theme')) === -1) {
		global.localStorage.setItem('theme', 'dark');
	}
	// Add some other default values to be on the safe side.
	if (!global.localStorage.getItem('exceptions')) {
		global.localStorage.setItem('exceptions', '');
	}
	if (global.localStorage.getItem('darken') !== 'false') {
		global.localStorage.setItem('darken', true);
	}

	function setDark(isDark) {
		global.localStorage.setItem("theme", (isDark ? 'dark' : 'light'));
		chrome.tabs.query({}, function(tabs) {
			for (var i=0; i<tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {type: 'com.rileyjshaw.dte__TOGGLE', isDark: isDark});
			}
		});
		setIcon(isDark);
		hub.postMessage({type: 'message', message: {isDark: isDark}});
	}

	// Chrome extensions don't currently let you listen to the extension button
	// from content scripts, so our background script acts as a dispatcher to
	// the active tab.
	function toggleClient (tab, skipExclusion) {
        var isDark = !('dark' == global.localStorage.getItem('theme'));
        setDark(isDark);
	}
	chrome.browserAction.onClicked.addListener(toggleClient);

	// ID of chrome native message hub
	// https://chrome.google.com/webstore/detail/native-message-hub/ekklkgmocbobcblcgmgaemojomkmhegp
	var cnmhID = 'ekklkgmocbobcblcgmgaemojomkmhegp';
	var hub = chrome.runtime.connect(cnmhID);
	hub.onMessage.addListener(function(msg) {
		switch(msg.type) {
			case 'response': {
				console.log(msg.response);
				break;
			}
			case 'message': {
				setDark(msg.message.isDark);
			}
		}
	});
	hub.postMessage({type: "connect", hostId: "dark theme everywhere host"});
	// The active tab will, in turn, let the background script know when it has
	// loaded new content so that we can re-initialize the tab.
	chrome.runtime.onMessage.addListener(
		function (request, sender) {
			// Early exit if the message isn't coming from a content script.
			var tab = sender.tab;
			if (request.type !== 'com.rileyjshaw.dte__READY' || !tab) {return;}

			var theme = global.localStorage.getItem('theme');
			var darken = global.localStorage.getItem('darken') === 'true';

			// XOR
			var isDark = isException(sender.url) !== (theme === 'dark');

			setIcon(isDark);
            chrome.tabs.sendMessage(tab.id, {type: 'com.rileyjshaw.dte__TOGGLE', isDark: isDark});
			if (!darken) {
				chrome.tabs.sendMessage(
					tab.id, {type: 'com.rileyjshaw.dte__REMOVE_MEDIA_FILTERS'});
			}
		}
	);

	// Returns a formatted list of exception URLs.
	function getExceptions () {
		return global.localStorage.getItem('exceptions')
			// Remove spaces.
			.replace(/ /g, '')
			// Split on commas or newlines.
			.split(/,|\n/)
			// Remove blank lines.
			.filter(function (exception) {return exception;})
			;
	}

	// Accepts a URL and an optional exceptions list. Returns true if any of the
	// list's fragments match the URL.
	function isException (url, exceptions) {
		return (exceptions || getExceptions()).some(function (exception) {
			return url.search(exception) !== -1;
		});
	}

	// Helper function to set the browser action icon.
	function setIcon (isDark) {
		var file = 'icon38' + (isDark ? '' : '-light') + '.png';
		chrome.browserAction.setIcon({path: chrome.extension.getURL(file)});
	}
}(this);
