var bools = ["images", "balance", "groups", "count_badge", "count_header",
             "notify_online", "notify_offline", "version", "link_names",
             "hide_empty", "location_icon"/*, "opt_out"*/];
var strings = ["popup_format", "name_format", "css"];
var radios = {"popout": ["default", "button", "never"],
              "location_link_format": ["SLURL", "native"]};
var colors = ["badge_bg_normal", "badge_bg_error", "badge_bg_offline"];

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

	$("#submit").click(save);
	$(".nameHelp").click(showHelp);
	$("#notificationLink").click(showNotificationHelp);
	$("#changelog_link").click(showChanges);

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
		$("#" + bools[i]).click(preview);
	for(var i in radios){
		for(var j in radios[i])
			$("#" + i + "_" + radios[i][j]).click(preview);
	}for(var i in strings)
		$("#" + strings[i]).keyup(preview);

	(function(){
		var node = document.createElement('style');
		document.body.appendChild(node);
		window.setStyleString = function(str){
			node.innerHTML = str;
		}
	}());

	init();
}

function showChanges(){
	$("#where_notifications").hide();
	$("#format_help").hide();
	$("#changes").html("").show();
	$("#modal-title").html("Changes");

	if(upcoming.length > 0){
		var h2 = document.createElement('h2');
		h2.innerText = "Coming Soon:";
		$("#changes").append(h2);

		var ul = document.createElement('ul');
		for(var i in upcoming){
			var li = document.createElement('li');
			li.innerText = upcoming[i];
			ul.appendChild(li);
		}$("#changes").append(ul);
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
		}$("#changes").append(ul);
	}

	var h2 = document.createElement('h2');
	h2.innerText = "Change Log:";
	$("#changes").append(h2);
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
	}$("#changes").append(table);
}function showNotificationHelp(){
	$("#where_notifications").show();
	$("#format_help").hide();
	$("#changes").hide();
	$("#modal-title").text("What happened to the notification options?");
}function showHelp(){
	$("#where_notifications").hide();
	$("#format_help").show();
	$("#changes").hide();
	$("#modal-title").text("Name formats");
}

function init(){
	var options = {};
	if(localStorage.options)
		options = JSON.parse(localStorage.options);

	for(var i in bools){
		if(options[bools[i]])
			$("#" + bools[i]).prop("checked", true);
	}for(var i in radios){
		for(var j in radios[i]){
			if(options[i] == radios[i][j])
				$("#" + i + "_" + radios[i][j]).prop("checked", true);
		}
	}for(var i in strings)
		$("#" + strings[i]).val(options[strings[i]] || "");

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
		options[bools[i]] = $("#" + bools[i]).prop("checked");
	for(var i in radios){
		for(var j in radios[i]){
			if($("#" + i + "_" + radios[i][j]).prop("checked"))
				options[i] = radios[i][j];
		}
	}for(var i in strings)
		options[strings[i]] = $("#" + strings[i]).val();
	for(var i in colors){
		var rgb = $('#' + colors[i]).spectrum("get").toRgb();
		options[colors[i]] = [rgb.r, rgb.g, rgb.b];
	}

	return options;
}

function preview(){
	var options = getOptions();
	setOptions(options, true);

	if(options.location_icon)
		$('#location_icon-options').slideDown();
	else
		$('#location_icon-options').slideUp();

	if(options.count_badge)
		$('#count_badge-options, #colors-header').animate({opacity: 1});
	else
		$('#count_badge-options, #colors-header').animate({opacity: 0});

	for(var state in badgeColors.values){
		var value = $('#' + state).spectrum("get").toHex();
		if(badgeColors.values[state] !== value){
			badgeColors.values[state]= value;
			badgeColors.last = state;
		}
	}

	chrome.extension.sendMessage({reload_dummy: true});
	if(checkEdits()){
		$('#save-msg').html("&larr; Don't forget to save!");
		$('footer').slideDown();
	}else{
		$('#save-msg').html("");
		$('footer').slideUp();
	}
}

function save(){
	var options = getOptions();
	setOptions(options);
	chrome.extension.sendMessage({reload: true});
	preview();

	$("#save-msg").text("Saved!");
	$('footer').slideUp();
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	if(request.reload || request.reload_dummy){
		setTimeout(function(){
			var options = JSON.parse(localStorage.dummy_options);

			if(options.count_badge){
				// Normally when multiplying you'd Math.min() each of these values with 255, but it seems like WebKit does that already
				var lightRGB = Math.round(options[badgeColors.last][0] * 1.5) + "," +
				               Math.round(options[badgeColors.last][1] * 1.5) + "," +
				               Math.round(options[badgeColors.last][2] * 1.5);
				var darkRGB = Math.round(options[badgeColors.last][0] / 3) + "," +
				              Math.round(options[badgeColors.last][1] / 3) + "," +
				              Math.round(options[badgeColors.last][2] / 3);
				$("#badge").css({
					display: "inline-block",
					background: "linear-gradient(to bottom,  rgba(" + lightRGB + ", .75) 0%, rgba(" + darkRGB + ", .75) 100%)"
				})
			}else
				$("#badge").hide();
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
