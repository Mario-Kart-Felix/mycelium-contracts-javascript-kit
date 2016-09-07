'use strict';

var bitcore = require('bitcore-lib');
var buffer = require('buffer');

//Constants' definitions

var BASE_URL = 'http://localhost:10000/jointescrow';
var WEBSOCKET_ENDPOINT = '/common-events';
var LOGIN_ENDPOINT = '/login/';
var REGISTER_ENDPOINT = '/register/';
var CREATE_CONTRACT_ENDPOINT = '/create-contract/';
var ADD_COUNTERPARTY_ENDPOINT = '/add-counterparty/';
var GET_CONTRACT_ENDPOINT = '/get-contract/';

/**
 * @desc MyceliumMultisig constructor.
 *
 * @param {Object} opts
 * @constructor
 */
function MyceliumMultisig(opts) {
  opts = opts || {};

  this.verbose = !!opts.verbose;  
  this.baseUrl = opts.baseUrl || BASE_URL;
  this.timeout = opts.timeout || 50000; //Write comments for each values!!

  this.initEvents();
};


MyceliumMultisig.prototype.initEvents = function() {

	var ws = new WebSocket("ws://localhost:10000/jointescrow" + WEBSOCKET_ENDPOINT);

	ws.onmessage = function(event) {
      //switch(event.type) {        
      //}
  		console.log(Date.now() + " " + event.data);
	};	
}


/**
 * @desc Makes a request 
 *
 * @param url: Requestion URL
 * @param method: GET or POST
 * @param isAsync: (OPTIONAL) True for async and False for Non-async | By default its Async 
 * @param data: (OPTIONAL) another Nested Object which should contains reqested Properties in form of Object Properties
 * @param callback: (OPTIONAL) Callback function to process after response | function(status, data) 
 */

MyceliumMultisig.prototype._doRequest = function(config) {

    if (!config.url) {
        console.log("No Url!");
        return;
    }

    if (!config.method) {
		    console.log("No Default method (GET/POST) given!");
        return;
    }

    if (!config.isAsync)
        config.isAsync = true;


    var xmlhttp = this.initXMLhttp();

    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            
            console.log("SuccessResponse");            
            console.log("Response Data:" + xmlhttp.responseText);
            
        } else {            
            console.log("FailureResponse --> State:" + xmlhttp.readyState + "Status:" + xmlhttp.status);
        }

        if (config.callback)
          config.callback(xmlhttp.readyState, xmlhttp.responseText);        
    }

    var sendString = [],
        sendData = config.data;
    if( typeof sendData === "string" ){
        var tmpArr = String.prototype.split.call(sendData,'&');
        for(var i = 0, j = tmpArr.length; i < j; i++){
            var datum = tmpArr[i].split('=');
            sendString.push(encodeURIComponent(datum[0]) + "=" + encodeURIComponent(datum[1]));
        }
    }else if( typeof sendData === 'object' && !( sendData instanceof String || (FormData && sendData instanceof FormData) ) ){
        for (var k in sendData) {
            var datum = sendData[k];
            if( Object.prototype.toString.call(datum) == "[object Array]" ){
                for(var i = 0, j = datum.length; i < j; i++) {
                        sendString.push(encodeURIComponent(k) + "[]=" + encodeURIComponent(datum[i]));
                }
            }else{
                sendString.push(encodeURIComponent(k) + "=" + encodeURIComponent(datum));
            }
        }
    }
    sendString = sendString.join('&');

    if (config.method == "GET") {
        xmlhttp.open("GET", config.url + "?" + sendString, config.isAsync);
        xmlhttp.send();
        
        console.log("GET fired at:" + config.url + "?" + sendString);
    }
    if (config.method == "POST") {
        xmlhttp.open("POST", config.url, config.isAsync);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(sendString);
        
        console.log("POST fired at:" + config.url + " || Data:" + sendString);
    }
}


MyceliumMultisig.prototype.initNotifications = function() {
}


MyceliumMultisig.prototype.initXMLhttp = function() {

    var xmlhttp;
    if (window.XMLHttpRequest) {
        //code for IE7,firefox chrome and above
        xmlhttp = new XMLHttpRequest();
    } else {
        //code for Internet Explorer
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    return xmlhttp;
}

/**
 * Do GET request
 * @private
 *
 * @param {String} url
 * @param {Object} args
 * @param {Callback} callback
 */
MyceliumMultisig.prototype._doGetRequest = function(url, args, callback) {
  return this._doRequest({url : url, 
        method : 'GET', 
        isAsync : true, 
        data: args, 
        callback : callback});
};

/**
 * Do a POST request
 * @private
 *
 * @param {String} url
 * @param {Object} args
 * @param {Callback} callback
 */
MyceliumMultisig.prototype._doPostRequest = function(url, args, callback) {
  return this._doRequest({url : url,
         method : 'POST', 
         isAsync : true, 
         data : args, 
         callback : callback});
};

/**
 * Makes login
 * @param {String} username - User name.
 * @param {String} password - User password. 
 */
MyceliumMultisig.prototype.login = function(username, password, callback) {
  var url = BASE_URL + LOGIN_ENDPOINT;
  var passBuf = new buffer.Buffer(password);
  var passHash = bitcore.crypto.Hash.sha256(passBuf);
  var opts = {username : username, passHash : passHash};
  this._doPostRequest(url, opts, function(err, response) {
    if (err) return callback(err);
    return callback(null, response);
  });
};

/**
 * Registers a new user.
 * @param {String} username - User name.
 * @param {String} password - User password. 
 */

MyceliumMultisig.prototype.register = function(username, password, callback) {
  var url = BASE_URL + REGISTER_ENDPOINT;
  var passBuf = new buffer.Buffer(password);
  var passHash = bitcore.crypto.Hash.sha256(passBuf);
  var opts = {username : username, passHash : passHash};  
  this._doPostRequest(url, opts, function(err, response) {
    if (err) return callback(err);
    return callback(null, response);
  });
};

 
/**
 * Creates a new contract.
 * @param {String} title - contract title.
 * @param {String} terms - contract terms. 
 */ 
MyceliumMultisig.prototype.createContract = function(title, terms, callback) {
	var url = BASE_URL + CREATE_CONTRACT_ENDPOINT;
	var opts = {title : title, terms : terms};

  	this._doPostRequest(url, opts, function(err, response) {
    	if (err) return callback(err);
    	return callback(null, response);
  	});	
};

/**
 * Adds a new conterparty to the contract.
 * @param {Integer} contractId - contractId.
 * @param {String} terms - contract terms. 
 */ 

MyceliumMultisig.prototype.addCounterparty = function(contractId, counterparty, callback) {
	var url = BASE_URL + ADD_COUNTERPARTY_ENDPOINT;
	var opts = {contractId : contractId, counterparty : counterparty};

  	this._doPostRequest(url, opts, function(err, response) {
    	if (err) return callback(err);
    	return callback(null, response);
  	});	
};

/**
 * Gets contract information.
 * @param {String} title - contract title.  
 */ 

MyceliumMultisig.prototype.getContract = function(contractId, callback) {
	var url = BASE_URL + GET_CONTRACT_ENDPOINT;
	var opts = {contractId : contractId, counterparty : counterparty};

  	this._doGetRequest(url, opts, function(err, response) {
    	if (err) return callback(err);
    	return callback(null, response);
  	});	
};


module.exports = MyceliumMultisig;