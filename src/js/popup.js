var EWrap, EContent, ENav, CurrentList, backgroundConnection;

function makeItem(type, item) {
	var endDate = parseInt(item.EndDate.substr(6));
	
	var contentItem = $$('div');
	contentItem.addClass('content-item');
	EContent.appendChild(contentItem);

	var image = $$('img');
	image.width = 85;
	image.height = 60;
	image.src = item.PictureHref;
	contentItem.appendChild(image);

	// Title

	var title = $$('div');
	title.addClass('title');
	contentItem.appendChild(title);

	var link = $$('a');
	link.href = 'http://www.trademe.co.nz/'+item.CategoryPath+'/auction-'+item.ListingId+'.htm';
	link.target = "_blank";
	link.innerHTML = item.Title;
	title.appendChild(link);

	var closingWrap = $$('small');
	title.appendChild(closingWrap);
	
	var closing;
	
	if(type == 'watchlist') {
		
		var difference = endDate - new Date().getTime();
		var remaining = getDateDiff(difference);
		
		if(remaining.secs >= 0 ) {
		
			closing = 'Closes: ' + remaining.days + ' days ' + remaining.hours + ' hours ' + remaining.mins + ' mins';
		
		} else {
			
			closing = 'Closing...';
			
		}

		if(remaining.days == 0 && remaining.hours <=3) {
			closingWrap.addClass('closing-soon');
		}
	} else {
		closing = 'Closed ' + new Date(endDate);
	}

	closingWrap.innerHTML = closing;

	// Bid information
	
	var bidInformation = $$('div');
	bidInformation.addClass('bid-information');
	contentItem.appendChild(bidInformation);

	var price = $$('div');
	var currentBid = item.MaxBidAmount ? item.MaxBidAmount : item.StartPrice;
	
	var a = String(currentBid);
	
	if(a.indexOf('.') == -1) {
		currentBid += '.00';
	} else if(a.split('.')[1].length !== 2) {
		currentBid += '0';
	}
	
	price.innerHTML = '$' + currentBid;
	bidInformation.appendChild(price);
	
	if(type == 'watchlist') {
	
		if(item.IsReserveMet) {		
			var reserveStatus = $$('small');
			reserveStatus.addClass('reserve-met');
			bidInformation.appendChild(reserveStatus);
			reserveStatus.innerHTML = 'Reserve Met';
		}

		var biddingStatus = $$('small');
		bidInformation.appendChild(biddingStatus);

		if(item.IsLeading) {
			biddingStatus.addClass('leading');
			biddingStatus.innerHTML = 'Leading';
		} else if(item.IsOutbid) {
			biddingStatus.addClass('outbid');
			biddingStatus.innerHTML = 'Outbid';
		}
		
	}
	// Clear

	var clear = $$('div');
	clear.addClass('clear');
	clear.innerHTML = '&nbsp;';
	contentItem.appendChild(clear);
	
}

function setCurrentNav(nav) {

	var navActive = ENav.querySelectorAll("li.active")[0];
	navActive.removeClass('active');

	var newNavActive = ENav.querySelectorAll('#nav-'+nav)[0];
	newNavActive.addClass('active');

	CurrentList = nav;
	
	backgroundConnection.postMessage({'type': nav});
	
	EContent.innerHTML = '<div class="status">Please wait...</div>';

}

window.onload = function() {

	// DOM elems
	EWrap = document.getElementById('wrap');
	EContent = document.getElementById('content');
	ENav = document.getElementsByTagName('nav')[0];

	var navItems = ENav.querySelectorAll("li");

	for(var i = 0; i < navItems.length; i++) {
		(function(navItem) {
			var navItemID = navItem.id.split('-')[1];
			navItem.onclick = function() {
				setCurrentNav(navItemID);
			}		
		})(navItems[i]);
	}

	backgroundConnection = chrome.extension.connect();

	backgroundConnection.onMessage.addListener(function(evt) {
		
		if(evt.type == 'notauthenticated') {
			EWrap.style.width = "280px";
			EContent.innerHTML = '<div class="status">Please authenticate.</div>';
		} else {
			if(evt.type == CurrentList) {
				EContent.innerHTML = "";
				if(evt.data.List.length === 0) {
					EContent.innerHTML = '<div class="status">Nothing here.</div>';	
				} else {
					for(var i = 0; i < evt.data.List.length; i++) {
						makeItem(evt.type, evt.data.List[i]);
					}
				}
			}
		}
	
	});

	setCurrentNav('watchlist');

}