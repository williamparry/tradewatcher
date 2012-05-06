var apiAuthorise = document.querySelectorAll('.apiAuthorize')[0];
var apiPinNumber = apiAuthorise.querySelectorAll(".apiPinNumber")[0];
var pin = Number(apiPinNumber.innerHTML.split('<div')[0].trim());
chrome.extension.sendRequest(!isNaN(pin) ? pin : false);
apiAuthorise.querySelectorAll('.apiText')[0].innerHTML = 'You may now close this tab.';
apiAuthorise.removeChild(apiPinNumber);