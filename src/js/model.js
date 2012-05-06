function LocalDAL(storage, defaultModel) {

	if(!localStorage[storage] || typeof localStorage[storage] == 'undefined') {
		localStorage[storage] = JSON.stringify(defaultModel || {});
	}

	this.set = function (key,val) {
		var localData = JSON.parse(localStorage[storage]);
		localData.UpdateProp(key,val);
		localStorage[storage] = JSON.stringify(localData);
	};

	this.get = function (key) {
		var localData = JSON.parse(localStorage[storage]);
		if(key) {
			return localData[key];
		}
		return localData;
	};
	
}