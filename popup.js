var options = {};
var params = {};

window.onload = function(){
	(function(){
		var node = document.createElement('style');
		document.body.appendChild(node);
		window.setStyleString = function(str){
			node.innerHTML = str;
		}
	}());

	init();
};

function init(){
	params = {};
	var vars = window.location.search.substring(1).split('&');
	for(var i in vars){
		var pair = vars[i].split('=');
		params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}

	if(localStorage.options){
		if(localStorage.error && !params.dummy){
			document.body.innerHTML = "";

			var div = document.createElement("div");
			div.id = "err";
			div.innerText = localStorage.error;

			document.body.appendChild(div);
		}else if(!(localStorage.notLoggedIn || localStorage.offline) || params.dummy){
			if(params.dummy)
				options = JSON.parse(localStorage.dummy_options);
			else
				options = JSON.parse(localStorage.options);

			if(options.balance){
				document.getElementById("balance").style.display = "table-cell";
				if(params.dummy)
					document.getElementById("balance").innerText = "L$9001";
				else if(localStorage.balance)
					document.getElementById("balance").innerText = localStorage.balance;
			}else
				document.getElementById("balance").style.display = "none";

			if(options.groups){
				document.getElementById("friends-button").style.display = "table-cell";
				document.getElementById("groups-button").style.display = "table-cell";
				document.getElementById("friends-link").onclick = gotoFriends;
				document.getElementById("groups-link").onclick = gotoGroups;
				document.getElementById("balance").style.padding = "";
			}else{
				document.getElementById("friends-button").style.display = "none";
				document.getElementById("groups-button").style.display = "none";
				document.getElementById("balance").style.padding = ".25em";
			}

			buildFriends();

			if(options.version){
				document.getElementById("version").innerText = "v" + chrome.app.getDetails().version;
				document.getElementById("version").style.display = "block";
				if(options.groups)
					document.getElementById("version").style.color = "black";
				else
					document.getElementById("version").style.color = "white";
			}else{
				document.getElementById("version").style.display = "none";
			}
		}else if(localStorage.offline){
			document.body.innerHTML = "";

			var div = document.createElement("div");
			div.id = "err";
			div.innerText = "Unable to connect to server!";

			document.body.appendChild(div);
		}else{
			document.body.innerHTML = "";

			var div = document.createElement("div");
			div.id = "err";
			div.innerText = "You aren't logged in!";

			var br = document.createElement("br");
			div.appendChild(br);

			var a = document.createElement("a");
			a.href = "#";
			a.innerText = "Log in";
			a.onclick = (function(){
				chrome.tabs.create({'url': "https://secondlife.com/my/"});
			});
			div.appendChild(a);

			document.body.appendChild(div);
		}
	}

	setStyleString(options.css);
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	if(request.updated && !params.dummy){
		switch(request.updated){
			case "online":
				var display = document.getElementById("online").style.display;
				if(display == "block" || display == "")
					buildFriends();
				break;
			case "groups":
				if(document.getElementById("groups").style.display == "block")
					buildGroups();
				break;
			case "balance":
				if(options.balance){
					if(localStorage.balance)
						document.getElementById("balance").innerText = localStorage.balance;
				}break;
		}
	}else if(request.reload || request.reload_dummy)
		setTimeout(init, 100);
});

function resizePopup(table){ // Hacky way to get the popup to resize
	table.style.width = "99%";
	setTimeout(function(){
		table.style.width = "100%";
	}, 10);
}

function loadProfile(e){
	var username = e.target.parentNode.name;
	if(!username)
		var username = e.target.parentNode.parentNode.name;
	chrome.tabs.create({'url': "http://my.secondlife.com/" + username});
}

function loadMap(e){
	var location = e.target.name;
	if(options.location_link_format == "SLURL")
		chrome.tabs.create({'url': "http://slurl.com/secondlife/" + location + "//"});
	else
		chrome.tabs.create({'url': "secondlife://" + location + "/0"});
	e.stopPropagation();
	return false;
}

function getOffset(el){
	var _x = 0;
	var _y = 0;
	while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)){
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}
	return {top: _y, left: _x};
}

function popout(){
	var url = "popup.html?popout";
	if(params.dummy)
		url += "&dummy";
	var x = window.screenLeft;
	var y = window.screenTop;
	if(window.top != window){
		var frames = window.top.document.getElementsByTagName('iframe');
		for(var i in frames){
			if(frames[i].src.indexOf("popup.html") != -1){
				var loc = getOffset(frames[i]);
				x = loc.left;
				y = loc.top;
				break;
			}
		}
	}window.open(url, 'popup', 'width=375,height=600,toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1,left=' + x + ',top=' + y);
	window.close();
}

function formatName(user, template){
	var output = template;
	var vars = ['UU', 'U', 'uu', 'u', 'F', 'f', 'LL', 'L', 'll', 'l', 'D'];
	for(var i in vars){
		var pattern = new RegExp('%' + vars[i], 'g');
		output = output.replace(pattern, user[vars[i]]);
	}return output;
}

function buildFriends(){
	var online = null;
	if(params.dummy){
		online = [{U: "Nexus Unplugged",
		          UU: "Nexus Unplugged",
		           u: "nexus.unplugged",
		          uu: "nexus.unplugged",
		           F: "Nexus",
		           f: "nexus",
		           L: "Unplugged",
		          LL: "Unplugged",
		           l: "unplugged",
		          ll: "unplugged",
		           D: "Nexus Unplugged",
		         loc: {sim: "Sandbox Cordova",
		                 x: "64",
		                 y: "128"}
		}, {U: "Nexus",
		   UU: "Nexus Resident",
		    u: "nexus",
		   uu: "nexus.resident",
		    F: "Nexus",
		    f: "nexus",
		    L: "",
		   LL: "Resident",
		    l: "",
		   ll: "resident",
		    D: "N3XU5",
		  loc: {sim: "Sandbox Goguen",
		          x: "42",
		          y: "100"}
		}];
	}else
		online = JSON.parse(localStorage.online);
	var table = document.getElementById("online");

	var extraColumn = false;
	if(options.location_icon){
		for(var i in online){
			if(online[i].loc)
				extraColumn = true;
		}
	}

	table.innerHTML = "";
	var th = document.createElement("th");
	if(extraColumn)
		th.colSpan = "3";
	else
		th.colSpan = "2";
	th.innerText = "Online Friends";

	if(options.count_header)
		th.innerText += " (" + online.length + ")";

	if(options.popout == "button" && !params.popout){
		var img = document.createElement('img');
		img.src = "img/popout.png";
		img.onclick = popout;
		th.appendChild(img);
	}

	var tr = document.createElement("tr");
	tr.appendChild(th);
	table.appendChild(tr);

	for(var i in online){
		if(options.images){
			var image = document.createElement("td");
			image.className = "image";
			var div = document.createElement("div");
			div.style.backgroundImage = "url(http://my-secondlife.s3.amazonaws.com/users/" + online[i].u + "/thumb_sl_image.png)";
			image.appendChild(div);
		}

		var name = document.createElement("td");
		name.className = "name";
		name.innerText = formatName(online[i], options.name_format);

		var tr = document.createElement("tr");
		tr.name = online[i].u;
		if(options.images)
			tr.appendChild(image);
		tr.appendChild(name);

		if(extraColumn){
			var location = document.createElement("td");
			location.className = "location";
			if(online[i].loc){
				var img = document.createElement("img");
				img.src = "img/globe.png";
				img.name = online[i].loc.sim + '/' + online[i].loc.x + '/' + online[i].loc.y;
				img.title = img.name;
				img.onclick = loadMap;
				location.appendChild(img);
			}tr.appendChild(location);
		}

		if(options.link_names){
			tr.onclick = loadProfile;
			tr.style.cursor = "pointer";
		}

		table.appendChild(tr);
	}if(online.length == 0){
		var td = document.createElement("td");
		td.className = "name";
		td.style.textAlign = "center";
		td.style.padding = "1em";
		td.innerText = "No contacts online.";

		var tr = document.createElement("tr");
		tr.appendChild(td);

		table.appendChild(tr);
	}

	resizePopup(table);
}

function buildGroups(){
	var online = null;
	if(params.dummy){
		groups = [
			{name: "ChromeLife", count: 9001},
			{name: "Phoenix-Firestorm Preview Group", count: 1504},
			{name: "Doctor Who Fans", count: 1021},
			{name: "Open Source Scripting", count: 518}
		];
	}else
		groups = JSON.parse(localStorage.groups);
	var table = document.getElementById("groups");

	table.innerHTML = "";
	var th = document.createElement("th");
	th.colSpan = "2";
	th.innerText = "Groups";
	var tr = document.createElement("tr");
	tr.appendChild(th);
	table.appendChild(tr);

	for(var i in groups){
		var name = document.createElement("td");
		name.className = "name";
		name.innerText = groups[i].name;

		var count = document.createElement("td");
		count.className = "count";
		count.innerText = groups[i].count;

		var tr = document.createElement("tr");
		tr.appendChild(name);
		tr.appendChild(count);

		table.appendChild(tr);
	}

	resizePopup(table);
}

function gotoFriends(){
	document.getElementById("friends-link").style.display = "none";
	document.getElementById("friends-label").style.display = "block";
	document.getElementById("groups-link").style.display = "block";
	document.getElementById("groups-label").style.display = "none";
	document.getElementById("online").style.display = "table";
	document.getElementById("groups").style.display = "none";

	buildFriends();
}

function gotoGroups(){
	document.getElementById("friends-link").style.display = "block";
	document.getElementById("friends-label").style.display = "none";
	document.getElementById("groups-link").style.display = "none";
	document.getElementById("groups-label").style.display = "block";
	document.getElementById("online").style.display = "none";
	document.getElementById("groups").style.display = "table";

	buildGroups();
}
