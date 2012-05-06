function getDateDiff(difference) {
	var ret		= {};
	ret.days	= Math.floor(difference / 1000 / 60 / 60 / 24);
	ret.hours	= Math.floor(difference / 1000 / 60 / 60 - (24 * ret.days));
	ret.mins	= Math.floor(difference / 1000 / 60 - (24 * 60 * ret.days) - (60 * ret.hours));
	ret.secs	= Math.floor(difference / 1000 - (24 * 60 * 60 * ret.days) - (60 * 60 * ret.hours) - (60 * ret.mins));
	return ret;
}

// Based on goo.gl/CLn3
Element.prototype.hasClass = function(cls) {
	return this.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
};

Element.prototype.addClass = function(cls) {
	if (!this.hasClass(cls)) { this.className += " " + cls; }
};

Element.prototype.removeClass = function(cls) {
	if (this.hasClass(cls)) {
    	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		this.className=this.className.replace(reg,' ');
	}
};

// Array indexof
Array.prototype.indexOf = Array.indexOf || function(needle) {
	for(var i = 0; i < this.length; i++) {
		if(this[i] == needle) {
			return i;
		}
	}
	return -1;
};

Array.prototype.indexOfObject = function(prop, val) {
	function traverseObject(obj) {
		if(typeof(obj) === 'object') {
			for(var e in obj) {
				if(obj[prop] == val) {
					return true;
				} else {
					return traverseObject(obj[e]);
				}
			}
		}
		return false;
	}
	for(var i = 0; i < this.length; i++) {
		if(this[i] == val) {
			return i;
		} else if(traverseObject(this[i])) {
			return i;
		}
	}
	return -1;
};

Object.prototype.UpdateProp = function(key,val) {
	var path = key.split('.');
	
	var objTraversals = 0;
	
	function traverse(obj) {
		if(typeof obj == 'object') {
			for(var y in obj) {
				if(y == path[objTraversals]) {
					if(objTraversals == path.length - 1) {
						obj[y] = val;
						return true;
					} else {
						objTraversals++;
						return traverse(obj[y]);
					}
				}
			}
		}
		return false;
	}
	
	for(var x in this) {
		if(x == path[objTraversals]) {
			if(objTraversals == path.length - 1) {
				this[x] = val;
				return;
			} else {
				objTraversals++;
				return traverse(this[x]);	
			}
		}
	}
	this[key] = val;
}

function $(e) {return document.getElementById(e)};
function $$(e) {return document.createElement(e)};