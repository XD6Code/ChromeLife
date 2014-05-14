var options = {};
var openID_base = "https://secondlife.com/auth/oid_return.php?redirect=https%3A%2F%2Fsecondlife.com%2Fmy%2Findex.php&openid_identifier=https%3A%2F%2Fid.secondlife.com%2Fid%2F";
var id = -1;
var interval = -1;
var count = 6;
var errors = 0;
var minorErrors = 0;
var waiting = false;

/*
var tracked = false;
var _paq = _paq || [];
_paq.push(["trackPageView"]);
*/

var DEBUG = false;
function debug(msg){
	if(DEBUG)
		console.log(msg);
}

function doOpenID(){
	if(localStorage.username){
		var frame = document.getElementsByTagName('iframe')[0];
		frame.src = openID_base + localStorage.username;
		debug("WAITING");
		waiting = true;
	}
}

function handleError(xmlhttp){
	if(xmlhttp.status == 0){
		errors++;
		if(errors == 3){ // Offline for 30 seconds
			chrome.browserAction.setBadgeBackgroundColor({color: options.badge_bg_error});
			chrome.browserAction.setBadgeText({text: '!'});
		}if(errors == 12) // Offline for 2 minutes
			localStorage.offline = true;
	}else if(xmlhttp.status == 401){
		notLoggedIn();
	}else{
		xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = (function(){
			if(xmlhttp.readyState != 4)
				return;
			if(xmlhttp.status == 200){
				var response = xmlhttp.responseText;
				//TODO: Change this to a regex, maybe?
				var temp = response.split("https://id.secondlife.com/id/");
				if(temp.length > 1){
					temp = temp[1].split('"');
					if(temp.length > 1){
						var username = temp[0];
						if(username == "anonymous")
							notLoggedIn();
						else{
							if(localStorage.notLoggedIn)
								delete localStorage.notLoggedIn;
							localStorage.username = username;
							doOpenID();
						}
					}
				}
			}
		});
		xmlhttp.open("GET", "https://secondlife.com/my/", true);
		xmlhttp.send();
	}
}

function notLoggedIn(){
	delete localStorage.offline;
	delete localStorage.username;
	localStorage.notLoggedIn = true;
	localStorage.online = "[]";
	chrome.browserAction.setBadgeBackgroundColor({color: options.badge_bg_error});
	chrome.browserAction.setBadgeText({text: '!'});
}

function updateContacts(){
	debug("Updating contacts...");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = (function(){
		if(xmlhttp.readyState != 4)
			return;
		if(xmlhttp.status == 200){
			errors = 0;
			delete localStorage.notLoggedIn;
			delete localStorage.offline;

			// This should never actually need to execute:
			if(document.getElementsByTagName('iframe')[0].src != "about:blank")
				document.getElementsByTagName('iframe')[0].src = "about:blank";

			var parser = new DOMParser();
			var response = parser.parseFromString(xmlhttp.responseText, "text/xml");
			var tds = response.getElementsByTagName("td");

			if(tds.length == 0 && localStorage.online.length > 2){
				// Very rarely, secondlife.com will forget that you have any
				// friends, returning "You don't have any friends yet.  Go make
				// some!" This happens infrequently enough that we can just
				// ignore the event, and everything will likely be fine in the
				// next request. It is, however, important to not treat this
				// response as an error, since it is a legitimate response in
				// the event that a user actually has no friends. :(

				minorErrors++;
				if(minorErrors <= 30)
					return;
			}else
				minorErrors = 0;

			var online = [];
			for(var i in tds){
    			if(tds[i].getAttribute && tds[i].getAttribute("class") == "trigger online friend"){
    				var name = false;
					var span = tds[i].getElementsByTagName('span')[0];
					if(span){
						if(span.hasAttribute("title"))
							name = span.getAttribute("title");
						else
							name = span.textContent.substr(1, span.textContent.length - 2);
					}else{
						var a = tds[i].getElementsByTagName('a')[0];
						if(a){
							name = a.textContent;
							
						}
					}if(name){
						var display = name;
						var location = false;
						var a = tds[i].getElementsByTagName('a')[0];
						if(a){
							display = a.textContent;

							var temp = a.getAttribute('href').split('//');
							if(temp.length > 1){
								temp = temp[1].split('/');
								if(temp.length > 2)
									location = temp;
							}
						}else{
							var subSpan = span.getElementsByTagName('span')[0];
							if(subSpan){
								var sLength = span.textContent.length;
								var ssLength = subSpan.textContent.length;
								var len = sLength - ssLength;
								display = span.textContent.substring(0, len);
							}else
								display = span.textContent;
						}

						var parse = name.split(' ');
						if(parse.length == 1)
							parse[1] = "Resident";
						var last = parse[1];
						if(last == "Resident"){
							name = parse[0];
							last = "";
						}

						var user = {U: name,
						           UU: parse[0] + ' ' + parse[1],
						            u: name.toLowerCase().replace(' ', '.'),
						           uu: (parse[0] + '.' + parse[1]).toLowerCase(),
						            F: parse[0],
						            f: parse[0].toLowerCase(),
						            L: last,
						           LL: parse[1],
						            l: last.toLowerCase(),
						           ll: parse[1].toLowerCase(),
						            D: display};
						if(location){
							user.loc = {sim: location[0],
							              x: location[1],
							              y: location[2]};
						}
						online.push(user);
					}
				}
			}

			var old_online = [];
			if(localStorage.online)
				old_online = JSON.parse(localStorage.online);
			online_names = [];
			for(var i in online)
				online_names[i] = online[i].uu;
			old_online_names = [];
			for(var i in old_online)
				old_online_names[i] = old_online[i].uu;
			if(!localStorage.offline && (options.notify_online || options.notify_offline)){
				var cache = [];
				var cache_names = [];
				for(var i in cache)
					cache_names.push(cache[i].uu);
				for(var i in old_online){
					if(cache_names.indexOf(old_online_names[i]) == -1){
						cache.push(old_online[i]);
						cache_names.push(old_online_names[i]);
					}
				}for(var i in online){
					if(cache_names.indexOf(online_names[i]) == -1){
						cache.push(online[i]);
						cache_names.push(online_names[i]);
					}
				}localStorage.cache = JSON.stringify(cache);

				var notifications = [];
				if(options.notify_online){
					var new_online = [];
					for(var i in online){
						if(old_online_names.indexOf(online_names[i]) == -1)
							new_online.push(online[i]);
					}for(var i in new_online){
						var name = encodeURIComponent(new_online[i].u);
						// While the id field could be useful, when it comes to
						// compatibility with old code it's nothing but a bother.
						// A unique ID makes it irrelevant.
						var uniq_id = "online" + i + new Date().getTime();
						chrome.notifications.create(uniq_id, {
							type: "basic",
							iconUrl: "http://my-secondlife.s3.amazonaws.com/users/" + name + "/thumb_sl_image.png",
							title: formatName(new_online[i], options.popup_format),
							message: "is online"
						}, uselessCallback);
						notifications.push(uniq_id);
					}
				}if(options.notify_offline){
					var new_offline = [];
					for(var i in old_online){
						if(online_names.indexOf(old_online_names[i]) == -1)
							new_offline.push(old_online[i]);
					}for(var i in new_offline){
						var name = encodeURIComponent(new_offline[i].u);
						var uniq_id = "offline" + i + new Date().getTime();
						chrome.notifications.create(uniq_id, {
							type: "basic",
							iconUrl: "http://my-secondlife.s3.amazonaws.com/users/" + name + "/thumb_sl_image.png",
							title: formatName(new_offline[i], options.popup_format),
							message: "is offline"
						}, uselessCallback);
						notifications.push(uniq_id);
					}
				}if(notifications.length){
					setTimeout(function(){
						for(var i in notifications)
							chrome.notifications.clear(notifications[i], uselessCallback);
					}, 5000);
				}
			}

			debug("Updating contacts... Done.");
			if(options.count_badge && (online.length > 0 || !options.hide_empty)){
				chrome.browserAction.setBadgeBackgroundColor({color: options.badge_bg_normal});
				chrome.browserAction.setBadgeText({text: online.length + ''});
			}else
				chrome.browserAction.setBadgeText({text: ''});
			localStorage.online = JSON.stringify(online);

			var matches = true;
			if(online.length == old_online.length){
				for(var i in online){
					if(old_online_names.indexOf(online_names[i]) == -1){
						matches = false;
						break;
					}
				}
			}else
				matches = false;
			if(!matches)
				chrome.extension.sendMessage({updated: "online"});
			
			count++;
			if(count > 6){
				count = 0;
				if(options.groups)
					updateGroups();
				if(options.balance)
					updateBalance();
			}
		}else
			handleError(xmlhttp);
	});
	xmlhttp.open("GET", "https://secondlife.com/my/loadWidgetContent.php?widget=widgetFriends", true);
	xmlhttp.send();
}

function uselessCallback(){
	// This callback isn't needed by this code, but Chrome's API insists that it
	// exist anyway. Hooray for "progress".
}

function sortGroups(a, b){
	if(a.count < b.count)
		return 1;
	if(a.count > b.count)
		return -1;
	return 0;
}

function updateGroups(){
	debug("Updating groups...");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = (function(){
		if(xmlhttp.readyState != 4)
			return;
		if(xmlhttp.status == 200){
			errors = 0;
			if(localStorage.notLoggedIn)
				delete localStorage.notLoggedIn;
			if(localStorage.offline)
				delete localStorage.offline;

			var parser = new DOMParser();
			var response = parser.parseFromString(xmlhttp.responseText, "text/xml");
			var trs = response.getElementsByTagName("tr")
			var groups = [];
			for(var i in trs){
				if(trs[i].getElementsByTagName){
					var tds = trs[i].getElementsByTagName("td");
					if(tds.length > 1){
						if(tds[0].firstChild && tds[0].firstChild.textContent && tds[1].textContent)
							groups.push({name: tds[0].firstChild.textContent,
							            count: parseInt(tds[1].textContent)});
					}
				}
			}

			debug("Updating contacts... Done.");
			groups.sort(sortGroups);
			var old_groups = localStorage.groups;
			var groups_json = JSON.stringify(groups)
			localStorage.groups = groups_json;
			if(old_groups != groups_json)
				chrome.extension.sendMessage({updated: "groups"});
		}else
			handleError(xmlhttp);
	});
	xmlhttp.open("GET", "https://secondlife.com/my/loadWidgetContent.php?widget=widgetGroups", true);
	xmlhttp.send();
}

function updateBalance(){
	debug("Updating balance...");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = (function(){
		if(xmlhttp.readyState != 4)
			return;
		if(xmlhttp.status == 200){
			errors = 0;
			if(localStorage.notLoggedIn)
				delete localStorage.notLoggedIn;
			if(localStorage.offline)
				delete localStorage.offline;

			var parser = new DOMParser();
			var response = parser.parseFromString(xmlhttp.responseText, "text/xml");
			var spans = response.getElementsByTagName("span");
			for(var i in spans){
				if(!spans[i].getAttribute)
					continue;
				if(spans[i].getAttribute("class") == "main-widget-content"){
					var strongs = spans[i].getElementsByTagName("strong");
					var balance = "L$0";
					if(strongs.length > 0)
						balance = strongs[0].textContent;

					debug("Updating contacts... Done.");
					var old_balance = localStorage.balance;
					localStorage.balance = balance;
					if(old_balance != balance)
						chrome.extension.sendMessage({updated: "balance"});
					return;
				}
			}
		}else
			handleError(xmlhttp);
	});
	xmlhttp.open("GET", "https://secondlife.com/my/loadWidgetContent.php?widget=widgetLindenDollar", true);
	xmlhttp.send();
}

function setOptions(obj){
	var options = options || {};
	if(localStorage.options)
		options = JSON.parse(localStorage.options);
	for(var i in obj)
		options[i] = obj[i];
	localStorage.options = JSON.stringify(options);
}

function formatName(user, template){
	var output = template;
	var vars = ['UU', 'U', 'uu', 'u', 'F', 'f', 'LL', 'L', 'll', 'l', 'D'];
	for(var i in vars){
		var pattern = new RegExp('%' + vars[i], 'g');
		output = output.replace(pattern, user[vars[i]]);
	}return output;
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	if(request.loaded){
		if(waiting){
			debug(["LOADED", request.loaded]);
			document.getElementsByTagName('iframe')[0].src = "about:blank";
			waiting = false;
			updateContacts();
		}else
			debug("wasn't waiting");
	}if(request.reload)
		init();
});

chrome.browserAction.onClicked.addListener(function(){
	if(options.popout == "default") // Without this, the browser seems to sometimes flash the window for a brief moment
		window.open('popup.html?popout', 'popup', 'width=375,height=600,toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1,left=9999,top=60');
});

/*function sendTrack(){
	if(tracked || options.opt_out)
		return;
	_paq.push(["setTrackerUrl", "https://track.xd6.co/piwik.php"]);
	_paq.push(["setSiteId", "4"]);
	var g = document.createElement("script");
	g.type = "text/javascript";
	g.defer = true;
	g.async = true;
	g.src = "https://track.xd6.co/piwik.js";
	var s = document.getElementsByTagName("script")[0];
	s.parentNode.insertBefore(g, s);
	tracked = true;
}*/

function init(){
	debug("Initializing...");
	options = JSON.parse(localStorage.options);

	var changed = false;
	for(var i in defaults){
		if(options[i] == undefined){
			options[i] = defaults[i];
			changed = true;
		}
	}if(changed)
		localStorage.options = JSON.stringify(options);

	// This makes extra sure the lengths of the arrays are correct;
	// Chrome throws a hissy fit if they're not.
	options.badge_bg_normal = [options.badge_bg_normal[0],
	                           options.badge_bg_normal[1],
	                           options.badge_bg_normal[2], 128];
	options.badge_bg_error = [options.badge_bg_error[0],
	                          options.badge_bg_error[1],
	                          options.badge_bg_error[2], 128];
	options.badge_bg_offline = [options.badge_bg_offline[0],
	                            options.badge_bg_offline[1],
	                            options.badge_bg_offline[2], 128];

	chrome.browserAction.setBadgeBackgroundColor({color: options.badge_bg_offline});
	chrome.browserAction.setBadgeText({text: '...'});

	if(options.popout == "default")
		chrome.browserAction.setPopup({popup: ''});
	else
		chrome.browserAction.setPopup({popup: 'popup.html'});

	count = 6;
	updateContacts();
	if(interval != -1)
		clearInterval(interval);
	interval = setInterval(updateContacts, 10000);

	/*sendTrack();*/
}

var version = chrome.app.getDetails().version;
if(localStorage.last_version != version){
	//alert("Updated to version " + version + ". New in this version: " + new);
	localStorage.last_version = version;
}

var defaults = {images: true,
               balance: true,
                groups: true,
           count_badge: true,
          count_header: true,
         notify_online: true,
        notify_offline: true,
         online_images: true,
        offline_images: true,
               version: false,
            link_names: true,
            hide_empty: true,
           name_format: "%D (%u)",
          popup_format: "%D (%u)",
          offline_gray: true,
                popout: "never",
       location_online: true,
      location_offline: true,
         location_icon: true,
  location_link_format: "SLURL",
       badge_bg_normal: [64, 255, 128],
        badge_bg_error: [255, 0, 0],
      badge_bg_offline: [128, 128, 128],
               /*opt_out: false,*/
                   css: "/* If you're not familiar with CSS,\nleave this box alone */"};
if(!localStorage.options){
	options = defaults;
	localStorage.options = JSON.stringify(options);
	setTimeout(function(){
		chrome.tabs.create({url: "options.html"});
	}, 100);
}if(!localStorage.dummy_options)
	localStorage.dummy_options = localStorage.options;

init();
