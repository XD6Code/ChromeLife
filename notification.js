var options = {};

window.onload = function(){
	(function(){
		var node = document.createElement('style');
		document.body.appendChild(node);
		window.setStyleString = function(str){
			node.innerHTML = str;
		}
	}());

	if(!webkitNotifications.createHTMLNotification && document.getElementById('notification').id){
		//if(webkitNotifications.createHTMLNotification)
		//	document.getElementById('notification').id = "rich";
		//else
			document.getElementById('notification').id = "plain";
	}

	init();
};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	if(request.reload || request.reload_dummy)
		setTimeout(init, 100);
});

function init(){
	var params = {};
	var vars = window.location.search.substring(1).split('&');
	for(var i in vars){
		var pair = vars[i].split('=');
		params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}

	if(params.dummy){
		document.body.style.overflow = "hidden";
		options = JSON.parse(localStorage.dummy_options);
	}else
		options = JSON.parse(localStorage.options);

	var cache = [];
	var username = params.name;
	var location = false;
	if(params.dummy){
		cache  = [{U: "Nexus Unplugged",
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
	}else if(localStorage.cache)
		cache = JSON.parse(localStorage.cache);
	for(var i in cache){
		if(cache[i].u == username){
			username = formatName(cache[i], options.popup_format);
			if(cache[i].loc)
				location = cache[i].loc.sim;
			break;
		}
	}

	if((params.action == "online" && options.online_images) ||
	   (params.action == "offline" && options.offline_images)){
		var url = "http://my-secondlife.s3.amazonaws.com/users/" + params.name + "/thumb_sl_image.png";
		document.getElementById("av").style.backgroundImage = "url(" + url + ")";
		document.getElementById("image").style.display = "block";
		if(params.action == "offline" && options.offline_gray)
			document.getElementById("image").className = "gray";
		else
			document.getElementById("image").className = "";
	}else if((params.action == "online" && !options.online_images) ||
	         (params.action == "offline" && !options.offline_images)){
		document.getElementById("image").style.display = "none";
	}document.body.className = params.action;

	document.getElementById("name").innerHTML = username;
	document.getElementById("action").innerHTML = "is <span>" + params.action + "</span>";

	if(location && ((params.action == "online" && options.location_online) ||
	                (params.action == "offline" && options.location_offline)))
		document.getElementById('location').innerText = location;
	else
		document.getElementById('location').innerText = "";

	setStyleString(options.css);
}

function formatName(user, template){
	var output = template;
	var vars = ['UU', 'U', 'uu', 'u', 'F', 'f', 'LL', 'L', 'll', 'l', 'D'];
	for(var i in vars){
		var pattern = new RegExp('%' + vars[i], 'g');
		output = output.replace(pattern, user[vars[i]]);
	}return output;
}
