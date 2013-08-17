var bools = ["images", "balance", "groups", "count_badge", "count_header",
             "notify_online", "notify_offline", "online_images",
             "offline_images", "version", "link_names", "hide_empty",
             "offline_gray", "location_online", "location_offline",
             "location_icon"/*, "opt_out"*/];
var strings = ["popup_format", "name_format", "css"];
var radios = {"popout": ["default", "button", "never"],
              "location_link_format": ["SLURL", "native"]};
var colors = ["badge_bg_normal", "badge_bg_error", "badge_bg_offline"];
var dependencies = ["count_badge", "location_icon", "notify_online",
                    "notify_offline", "offline_images"];

var badgeColors = {"last": "badge_bg_normal", "values": {}};

function checkEdits(){
	if(localStorage.options != localStorage.dummy_options)
		return "You have unsaved changes.";
    return undefined;
}

window.onbeforeunload = checkEdits;

window.onload = function(){
	localStorage.dummy_options = localStorage.options;
	setTimeout(function(){
		chrome.extension.sendMessage({reload_dummy: true});
	}, 100);

	document.getElementById("submit").onclick = save;
	document.getElementById("closeHelp").onclick = hideHelp;
	document.getElementById("help").onclick = hideHelp;
	document.getElementsByClassName("box")[0].onclick = cancel;
	templates = document.getElementsByClassName('template');
	for(var i in templates){
		if(!templates[i].parentNode)
			continue;
		var helpLink = document.createElement('a');
		helpLink.className = 'helpLink';
		helpLink.href = '#';
		helpLink.onclick = showHelp;
		helpLink.innerText = "?";
		templates[i].parentNode.insertBefore(helpLink, templates[i].nextSibling);
	}

	document.getElementById("changelog_link").onclick = showChanges;

	document.getElementById("css").onkeydown = function(e){
		if(e.keyCode === 9){
			var start = this.selectionStart;
			var end = this.selectionEnd;
			this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
			this.selectionStart = this.selectionEnd = start + 1;
			e.stopPropagation();
			return false;
		}
	};

	for(var i in bools)
		document.getElementById(bools[i]).onclick = preview;
	for(var i in radios){
		for(var j in radios[i])
			document.getElementById(i + "_" + radios[i][j]).onclick = preview;
	}for(var i in strings)
		document.getElementById(strings[i]).onkeyup = preview;

	(function(){
		var node = document.createElement('style');
		document.body.appendChild(node);
		window.setStyleString = function(str){
			node.innerHTML = str;
		}
	}());

	if(!webkitNotifications.createHTMLNotification){
		document.getElementById('online_preview').style.height = "60px";
		document.getElementById('offline_preview').style.height = "60px";

		document.getElementById('notify_online-options').style.display = "none";
		document.getElementById('notify_offline-options').style.display = "none";

		document.getElementById('notificationLink').style.display = "block";
		document.getElementById('notificationLink').onclick = showNotificationHelp;
	}

	init();
}

function showChanges(){
	document.getElementById("where_notifications").style.display = "none";
	document.getElementById("format_help").style.display = "none";
	document.getElementById("changes").style.display = "block";
	document.getElementById("changes").innerHTML = "";

	if(upcoming.length > 0){
		var h2 = document.createElement('h2');
		h2.innerText = "Coming Soon:";
		document.getElementById("changes").appendChild(h2);

		var ul = document.createElement('ul');
		for(var i in upcoming){
			var li = document.createElement('li');
			li.innerText = upcoming[i];
			ul.appendChild(li);
		}document.getElementById("changes").appendChild(ul);
	}

	if(distant.length > 0){
		var h2 = document.createElement('h2');
		h2.innerText = "Down the Road:";
		document.getElementById("changes").appendChild(h2);

		var ul = document.createElement('ul');
		for(var i in distant){
			var li = document.createElement('li');
			li.innerText = distant[i];
			ul.appendChild(li);
		}document.getElementById("changes").appendChild(ul);
	}

	var h2 = document.createElement('h2');
	h2.innerText = "Change Log:";
	document.getElementById("changes").appendChild(h2);
	var table = document.createElement('table');
	for(var i in versions){
		var tr1 = document.createElement('tr');

		var version = document.createElement('td');
		version.setAttribute("rowspan", "2");
		version.innerText = versions[i].version;
		tr1.appendChild(version);

		var name = document.createElement('td');
		name.innerText = versions[i].name;
		name.className = "versionName";
		tr1.appendChild(name);

		table.appendChild(tr1);
		var tr2 = document.createElement('tr');

		var col = document.createElement('td');
		var innerTable = document.createElement('table');
		if(versions[i].changes.length > 0){
			for(var j in versions[i].changes){
				var changeRow = document.createElement('tr');
				if(j == 0){
					var changeLabel = document.createElement('th');
					changeLabel.innerText = "Changes: ";
					changeLabel.setAttribute("rowspan", versions[i].changes.length);
					changeRow.appendChild(changeLabel);
				}var change = document.createElement('td');
				change.innerText = versions[i].changes[j];
				changeRow.appendChild(change);
				innerTable.appendChild(changeRow);
			}
		}if(versions[i].fixes.length > 0){
			for(var j in versions[i].fixes){
				var fixRow = document.createElement('tr');
				if(j == 0){
					var fixLabel = document.createElement('th');
					fixLabel.innerText = "Fixes: ";
					fixLabel.setAttribute("rowspan", versions[i].fixes.length);
					fixRow.appendChild(fixLabel);
				}var fix = document.createElement('td');
				fix.innerText = versions[i].fixes[j];
				fixRow.appendChild(fix);
				innerTable.appendChild(fixRow);
			}
		}col.appendChild(innerTable);
		tr2.appendChild(col);

		table.appendChild(tr2);
		if(i < versions.length - 1){
			var placeholder = document.createElement('tr');
			var placeholderCol = document.createElement('td');
			placeholderCol.setAttribute("colspan", "2");
			placeholderCol.innerText = " ";
			placeholder.appendChild(placeholderCol);
			table.appendChild(placeholder);
		}
	}document.getElementById("changes").appendChild(table);

	document.getElementById("help").style.display = "block";
}function showNotificationHelp(){
	document.getElementById("where_notifications").style.display = "block";
	document.getElementById("format_help").style.display = "none";
	document.getElementById("changes").style.display = "none";
	document.getElementById("help").style.display = "block";
}function showHelp(){
	document.getElementById("where_notifications").style.display = "none";
	document.getElementById("format_help").style.display = "block";
	document.getElementById("changes").style.display = "none";
	document.getElementById("help").style.display = "block";
}function hideHelp(){
	document.getElementById("help").style.display = "none";
}function cancel(e){
	e.stopPropagation();
}

function init(){
	var options = {};
	if(localStorage.options)
		options = JSON.parse(localStorage.options);

	for(var i in bools){
		if(options[bools[i]])
			document.getElementById(bools[i]).checked = true;
	}for(var i in radios){
		for(var j in radios[i]){
			if(options[i] == radios[i][j])
				document.getElementById(i + "_" + radios[i][j]).checked = true;
		}
	}for(var i in strings)
		document.getElementById(strings[i]).value = options[strings[i]] || "";

	for(var i in colors){
		var spectrum_opts = {
			showInput: true,
			showPalette: true,
			palette: [
				['black', 'white', 'linden'],
				['blue', 'yellow', 'red'],
				['green', 'purple', 'gray']
			],
			showInitial: true,
			clickoutFiresChange: true,
			showButtons: false,
			preferredFormat: "name",
			change: preview,
			move: preview
		};
		var color = $('#' + colors[i]);
		if(options[colors[i]]){
			var c = options[colors[i]];
			color.val("rgb " + c[0] + " " + c[1] + " " + c[2]);
		}

		color.spectrum(spectrum_opts);
		badgeColors.values[colors[i]] = color.spectrum("get").toHex();
	}

	setStyleString(options.css);
	preview();
}

function getOptions(){
	var options = {};
	for(var i in bools)
		options[bools[i]] = document.getElementById(bools[i]).checked;
	for(var i in radios){
		for(var j in radios[i]){
			if(document.getElementById(i + "_" + radios[i][j]).checked)
				options[i] = radios[i][j];
		}
	}for(var i in strings)
		options[strings[i]] = document.getElementById(strings[i]).value;
	for(var i in colors){
		var rgb = $('#' + colors[i]).spectrum("get").toRgb();
		options[colors[i]] = [rgb.r, rgb.g, rgb.b];
	}

	return options;
}

function preview(){
	var options = getOptions();
	setOptions(options, true);

	var changed = [];
	for(var i in dependencies){
		if(document.getElementById(dependencies[i] + "-options")){
			if(options[dependencies[i]])
				$('#' + dependencies[i] + "-options").removeClass('disabled');
			else
				$('#' + dependencies[i] + "-options").addClass('disabled');
		}var inputs = $('#' + dependencies[i] + "-options input");
		for(var j = 0; j < inputs.length; j++){
			if(changed.indexOf(inputs[j].id) === -1){
				inputs[j].disabled = !options[dependencies[i]];
				if(!options[dependencies[i]])
					changed.push(inputs[j].id);
			}
		}
	}

	for(var state in badgeColors.values){
		var value = $('#' + state).spectrum("get").toHex();
		if(badgeColors.values[state] !== value){
			badgeColors.values[state]= value;
			badgeColors.last = state;
		}
	}

	chrome.extension.sendMessage({reload_dummy: true});
	if(checkEdits())
		document.getElementById('save-msg').innerHTML = "&larr; Don't forget to save!";
	else
		document.getElementById('save-msg').innerHTML = "";
}

function save(){
	var options = getOptions();
	setOptions(options);
	chrome.extension.sendMessage({reload: true});
	preview();

	document.getElementById("saved").style.display = "block";
	setTimeout(function(){
		document.getElementById("saved").style.display = "none";
	}, 5000);
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	if(request.reload || request.reload_dummy){
		setTimeout(function(){
			var options = JSON.parse(localStorage.dummy_options);

			if(options.count_badge){
				var badge = document.getElementById('badge')
				badge.style.display = "inline-block";
				// Normally when multiplying you'd Math.min() each of these values with 255, but it seems like WebKit does that already
				var lightRGB = Math.round(options[badgeColors.last][0] * 1.5) + "," +
				               Math.round(options[badgeColors.last][1] * 1.5) + "," +
				               Math.round(options[badgeColors.last][2] * 1.5);
				var darkRGB = Math.round(options[badgeColors.last][0] / 3) + "," +
				              Math.round(options[badgeColors.last][1] / 3) + "," +
				              Math.round(options[badgeColors.last][2] / 3);
				badge.style.background = "linear-gradient(to bottom,  rgba(" + lightRGB + ", .75) 0%, rgba(" + darkRGB + ", .75) 100%)";
			}else
				document.getElementById('badge').style.display = "none";

			if(options.notify_online)
				document.getElementById('online_preview').style.display = "block";
			else
				document.getElementById('online_preview').style.display = "none";

			if(options.notify_offline)
				document.getElementById('offline_preview').style.display = "block";
			else
				document.getElementById('offline_preview').style.display = "none";
		}, 100);
	}
});

// You don't need to supply all the options. Fields omitted from the supplied
// object will be preserved in localStorage.options. Supplying an empty object
// will result in localStorage.options being parsed, re-encoded, and then
// written over itself WITHOUT change. This could allow partial options to be
// imported without disturbing others.
// If dummy == true, options will only applied to preview items.
function setOptions(obj, dummy){
	var options = {};
	if(!dummy && localStorage.options)
		options = JSON.parse(localStorage.options);
	else if(dummy && localStorage.dummy_options)
		options = JSON.parse(localStorage.options);
	for(var i in obj)
		options[i] = obj[i];
	if(!dummy)
		localStorage.options = JSON.stringify(options);
	localStorage.dummy_options = JSON.stringify(options);
}
