'use strict';

const createError = require('http-errors');
const debug = require('debug')('cfgram:basic-auth-middleware');

module.exports = function(req, res, next) {
  debug('basic auth');

  //header with auth prop of basic ex: e7wqilwbf:2138102730
  var authHeader = req.headers.authorization;
  if(!authHeader) {
    return next(createError(401, 'authorization header required'));
  }

  //ex: awfeyhqwliufhq:9734yfliwdh
  var base64str = authHeader.split('Basic ')[1];
  if(!base64str) {
    return next(createError(401, 'username and password required'));
  }

  //ex: myusername:mypassword
  var utf8str = new Buffer(base64str, 'base64').toString();
  var authArr = utf8str.split(':');

  //ex: {username: myusername, password: mypassword}
  req.auth = {
    username: authArr[0],
    password: authArr[1]
  };

  if(!req.auth.username) {
    return next(createError(401, 'username required'));
  }

  if(!req.auth.password) {
    return next(createError(401, 'password required'));
  }

  next();
};
