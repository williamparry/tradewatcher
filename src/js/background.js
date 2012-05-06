var popupConnection = null;
var watchlist = null;
var model = new LocalDAL('tradewatcher');
var serviceUrl = "https://tradewatcher-proxy.appspot.com";
var winning = [];

function checkAuth() {
	if(typeof model.get('oauth_token') == 'undefined'){
		chrome.browserAction.setTitle({'title': 'Not authenticated'});
		chrome.browserAction.setBadgeText({'text': '-'});
		chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
		if(watchlist) {
			watchlist.stopGet();
		}
		getRequestToken();
		return false;
	}
	return true;
}

function getRequestToken() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", serviceUrl + "/RequestToken", true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if(xhr.responseText) {
				auth = JSON.parse(xhr.responseText);
				model.set('AccessToken_oauth_token',auth.oauth_token);
				model.set('AccessToken_oauth_token_secret',auth.oauth_token_secret);
				chrome.tabs.create({
					"url":"https://secure.trademe.co.nz/Oauth/Authorize?oauth_token="+auth.oauth_token,
					 "selected": true
				});
			}
		}
	};
	xhr.send(null);
}

function getAccessToken(verifier) {
	var url = serviceUrl +"/AccessToken/" + model.get('AccessToken_oauth_token') +
		'/' + model.get('AccessToken_oauth_token_secret') + '/' + verifier;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url , true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if(xhr.responseText) {
				auth = JSON.parse(xhr.responseText);
				model.set('oauth_token', auth.oauth_token);
				model.set('oauth_token_secret', auth.oauth_token_secret);
				setWatchlist();
			}
		}
	};
	xhr.send(null);
}

// Called by getAccessToken
// Called by init
function setWatchlist() {
	watchlist = new Watchlist();
}

function stopWatchlist() {
	model.set('oauth_token', undefined);
	model.set('oauth_token_secret', undefined);
	checkAuth();
	watchlist = null;
}


function Watchlist() {
	var isGetting = false;
	var timeout = null;
	var xhr = new XMLHttpRequest();
	var url = serviceUrl +"/GetWatchlist/" + model.get('oauth_token') + '/' + model.get('oauth_token_secret');
	this.stopGet = function() {
		xhr.abort();
		isGetting = false;
		clearTimeout(timeout);
		timeout = null;
	};
	
	this.override = function() {
		this.stopGet();
		get();
	};
	
	function get() {
		if(isGetting) { return false; }
		isGetting = true;
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				isGetting = false;
				chrome.browserAction.setBadgeText({'text': ''});
				chrome.browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 255]});
				if(xhr.responseText) {
					if(xhr.responseText.indexOf('ErrorDescription') !== -1) {
						stopWatchlist();
					} else {
						var res = JSON.parse(xhr.responseText);
						var delay = 10000;
						var data = [];
						
						// check winning before the check because they could have lost and the item is no longer there
						var outbid = [];
						for(var w = 0; w < winning.length; w++) {
							// does exist
							var ind = res.List.indexOfObject("ListingId", winning[w].ListingId);
							if(ind !== -1) {
								if(!res.List[ind].IsLeading) {
									// does exist but is outbid
									outbid.push(res.List[ind]);
								}
							} else {
								// does not exist anymore
								outbid.push(winning[w]);
							}
						}
						// show outbid
						for(var j = 0; j < outbid.length; j++) {
							webkitNotifications.createNotification("img/logo.png","You've been outbid", outbid[j].Title).show();
						}
						// reset winning
						winning = [];
						
						if(res.List.length > 0) {
							for(var i = 0; i < res.List.length; i++) {
								var endDate = parseInt(res.List[i].EndDate.substr(6));
								var difference = endDate - new Date().getTime();
								if(difference > 0) {
									data.push(res.List[i]);
									if(res.List[i].IsLeading) {
										winning.push(res.List[i]);
									}
								}
							}
							var topItem = res.List[0];
							if(topItem.IsLeading || topItem.IsOutbid) {
								var endDate = parseInt(topItem.EndDate.substr(6));
								var difference = endDate - new Date().getTime();
								// TODO: optimise this (don't need conversion to date object)
								var d = getDateDiff(difference);
								if(d.days === 0 && d.hours === 0 && d.mins === 0 && d.secs < 59) {
									delay = 4000;
								}
							}
							chrome.browserAction.setBadgeText({'text': String(data.length)})
						}
						
						model.set('watchlist',data);
						sendWatchlist();
						timeout = setTimeout(function() { get(); }, delay);	
						
					}
				}
			}
		};
		xhr.send(null);
	}
	get();
};

function sendWatchlist() {
	if(popupConnection) {
		popupConnection.postMessage({'type': 'watchlist', data: {List: model.get('watchlist') }});
	}	
}

function sendWon() {	
	var url = serviceUrl +"/GetWon/" + model.get('oauth_token') +
		'/' + model.get('oauth_token_secret');
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url , true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if(xhr.responseText) {
				if(popupConnection) {
					popupConnection.postMessage({'type': 'won', data: JSON.parse(xhr.responseText)});
				}
			}
		}
	};
	xhr.send(null);
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if(!isNaN(request)) {
		getAccessToken(request);
	}
});

chrome.extension.onConnect.addListener(function(port) {
	popupConnection = port;
	popupConnection.onDisconnect.addListener(function(evt) {
		popupConnection = null;
	});
	popupConnection.onMessage.addListener(function(evt) {
		if(!checkAuth()) {
			popupConnection.postMessage({type:'notauthenticated'});
			return false;
		}
		switch(evt.type) {
			case 'watchlist': default:
				watchlist.override();
				sendWatchlist();
			break;
			case 'won':
				sendWon();
			break;
		}
		
	});
	
});


if(checkAuth()) { setWatchlist(); }