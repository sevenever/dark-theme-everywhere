!function (global) {
	// Skip iframes.
	try {if (global.self !== global.top) return;} catch (e) {return;}

	var html = document.documentElement;
	// Keeps track of the current toggle state.
	var isDark = true;

	// This should never be called by a content script outside of a listener. We
	// expose it to background.js through listeners, and trust background.js as
	// the dispatcher.
	function toggle () {
		html.classList[(isDark ? 'add' : 'remove')]('dark-theme-everywhere-off');
		isDark = !isDark;
	}

	// If the background script (i.e. dispatcher) says "toggle", toggle!
	chrome.runtime.onMessage.addListener(function (request, sender, response) {
		// Early exit if the message is invalid or coming from another content
		// script.
		if (!request || sender.tab) {return;}

		switch (request.type) {
			case 'com.rileyjshaw.dte__REMOVE_MEDIA_FILTERS':
				html.classList.add('dark-theme-everywhere-filters-off');
				break;
			case 'com.rileyjshaw.dte__TOGGLE':
                isDark = request.isDark;
                html.classList.remove(specificityHelper);
                html.classList.add(specificityHelper);
                html.classList[(isDark ? 'remove' : 'add')]('dark-theme-everywhere-off');
				if (typeof response === 'function') {
					response({isDark: isDark, url: global.location.hostname});
				}
				break;
		}
	});

	// Let the background script know that we've loaded new content.
	chrome.runtime.sendMessage({type: 'com.rileyjshaw.dte__READY'});

	// HACK(riley): To gain an advantage in the specificity wars (against RES,
	//              for example), add an ID to the <html> or <body> element if
	//              one doesn't already exist. It's not a perfect solution:
	//              - If <html> and <body> both have ids, no id is applied.
	//              - Triples the size of injected CSS, since each line needs a
	//                html#specificityHelper and body#specificityHelper variant.
	//
	//              I do, however, prefer it over some of the alternatives:
	//              - Multiple space-delimited ids aren't valid.
	//              - Lone classes don't provide a strong specificity gain.
	//              - xml:id no-longer matches CSS selectors _or_ getElementById.
	//              - Wrapping the children of <body> might lead to a mess of
	//                layout and script problems.
	//              - Toggling inline styles is a huge pain right now, and though
	//                it might be the right idea some day it's far beyond the
	//                scope of this project.
	var specificityHelper = 'dark-theme-everywhere-specificity-helper';
	html.classList.add(specificityHelper);
	document.addEventListener('DOMContentLoaded', function () {
		var body = document.body;
		body.classList.add(specificityHelper);
		if (!html.id) html.id = specificityHelper;
		else if (!body.id) body.id = specificityHelper;
	});
}(this);
