/* ============================================================
 * node.tradeogre.api
 * https://github.com/RealAwesomeness/node.tradeogre.api
 *
 * ============================================================
 * Copyright 2019-, David Chen
 * Released under the MIT License
 * ============================================================ */

var NodeTradeOgreApi = function(options) {
  'use strict';

  var request = require('request'),
    assign = require('object-assign'),
    jsonic = require('jsonic'),
    signalR = require('signalr-client'),
    wsclient,

  var default_request_options = {
    method: 'GET',
    agent: false,
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Node Tradeogre API)',
      'Content-type': 'application/x-www-form-urlencoded'
    }
  };

  var opts = {
    baseUrl: 'https://tradeogre.com/api/v1',
    apikey: 'APIKEY',
    apisecret: 'APISECRET',
    verbose: false,
    cleartext: false,
    inverse_callback_arguments: false,
    requestTimeoutInSeconds: 15,
  };

  var extractOptions = function(options) {
    var o = Object.keys(options),
      i;
    for (i = 0; i < o.length; i++) {
      opts[o[i]] = options[o[i]];
    }
  };

  if (options) {
    extractOptions(options);
  }

  var apiCredentials = function(uri) {
    var options = {
      apikey: opts.apikey,
    };

    return setRequestUriGetParams(uri, options);
  };

  var setRequestUriGetParams = function(uri, options) {
    var op;
    if (typeof(uri) === 'object') {
      op = uri;
      uri = op.uri;
    } else {
      op = assign({}, default_request_options);
    }


    var o = Object.keys(options),
      i;
    for (i = 0; i < o.length; i++) {
      uri = updateQueryStringParameter(uri, o[i], options[o[i]]);
    }

    op.headers.apisign = uri, opts.apisecret;
    op.uri = uri;
    op.timeout = opts.requestTimeoutInSeconds * 1000;

    return op;
  };

  var updateQueryStringParameter = function(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";

    if (uri.match(re)) {
      uri = uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
      uri = uri + separator + key + "=" + value;
    }

    return uri;
  };

  var sendRequestCallback = function(callback, op) {
    var start = Date.now();

    request(op, function(error, result, body) {
      ((opts.verbose) ? console.log("requested from " + op.uri + " in: %ds", (Date.now() - start) / 1000) : '');
      if (!body || !result || result.statusCode != 200) {
        var errorObj = {
          success: false,
          message: 'URL request error',
          error: error,
          result: result,
        };
        return ((opts.inverse_callback_arguments) ?
          callback(errorObj, null) :
          callback(null, errorObj));
      } else {
        try {
          result = JSON.parse(body);
        } catch (err) {}
        if (!result || !result.success) {
          // error returned by bittrex API - forward the result as an error
          return ((opts.inverse_callback_arguments) ?
            callback(result, null) :
            callback(null, result));
        }
        return ((opts.inverse_callback_arguments) ?
          callback(null, ((opts.cleartext) ? body : result)) :
          callback(((opts.cleartext) ? body : result), null));
      }
    });
  };

  var publicApiCall = function(url, callback, options) {
    var op = assign({}, default_request_options);
    if (!options) {
      op.uri = url;
    }
    sendRequestCallback(callback, (!options) ? op : setRequestUriGetParams(url, options));
  };

  var credentialApiCall = function(url, callback, options) {
    if (options) {
      options = setRequestUriGetParams(apiCredentials(url), options);
    }
    sendRequestCallback(callback, options);
  };
    sendCustomRequest: function(request_string, callback, credentials) {
      var op;

      if (credentials === true) {
        op = apiCredentials(request_string);
      } else {
        op = assign({}, default_request_options, { uri: request_string });
      }
      sendRequestCallback(callback, op);
    },
    getmarkets: function(callback) {
      publicApiCall(opts.baseUrl + '/markets', callback, null);
    },
    getticker: function(market, callback) {
      publicApiCall(opts.baseUrl + '/ticker/'+market, callback);
    },
    getorderbook: function(market, callback) {
      publicApiCall(opts.baseUrl + '/orders/'+market, callback);
    },
    getmarkethistory: function(market, callback) {
      publicApiCall(opts.baseUrl + '/history/'+market, callback);
    },
    buy: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/order/buy', callback, options);
    },
    sell: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/order/sell', callback, options);
    },
    cancel: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/order/cancel', callback, options);
    },
    getopenorders: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/account/orders', callback, options);
    },
    getbalances: function(callback) {
      credentialApiCall(opts.baseUrl + '/account/balances', callback, {});
    },
    getbalance: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/account/balance', callback, options);
    },
    getorder: function(callback, options) {
      credentialApiCall(opts.baseUrl + '/account/order', callback, options);
    },
  };
};

module.exports = NodeTradeOgreApi();

module.exports.createInstance = NodeTradeOgreApi;
