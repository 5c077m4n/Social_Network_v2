'use strict';
const jwt = require('jsonwebtoken');
const resError = require('../respond-error');
const publicKey = require('../../localData/key.json').publicKey;

module.exports.loggedOut = (req, res, next) => {
	if(req.session && req.session.user) return res.redirect('/profile');
	else return next();
};

module.exports.requiresLogin = (req, res, next) => {
	if(req.session && req.session.user) return next();
	else return resError(res, 401, 'You must be logged in to view this page');
};

module.exports.isAdmin = (req, res, next) => {
	if(req.session.user.isAdmin) return next();
	return resError(res, 401, 'Sorry, only administrators are allowed here');
};

module.exports.isUser = (req, res, next) => {
	if(req.session.user.isAdmin) return next();
	const decoded = jwt.verify(req.session.token, publicKey);
	if(req.session.user._id === decoded._id) return next();
	else return resError(res, 401, 'Sorry, only authorised users are allowed here');
};