'use strict';
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const resError = require('../respond-error');
const config = require('../config');
const publicKey = require('../../localData/key.json').publicKey;

const decodeToken = (req, res, next) => {
	return new Promise((resolve, reject) => {
		const token = req.headers['x-access-token'];
		if(!token) return resError(res, 403, 'No token provided.');
		const decoded = jwt.verify(token, publicKey, {algorithms: ['HS512']});
		User
		.findById(decoded._id)
		.select('+secret')
		.exec((queryError, user) => {
			if(queryError) return reject(queryError);
			if(decoded.secret === user.secret) return resolve(decoded);
			return resError(res, 401, null);
		});
	});
};

module.exports.cors = (req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accepted');
	if(req.method.toUpperCase() === 'OPTIONS')
	{
		res.header('Access-Control-Allow-Methods', 'PUT, POST, DELETE');
		return res.status(200).json({});
	}
	return next();
};

module.exports.validVote = (req, res, next) => {
	if(req.params.direction.search(/^(up|down)$/) === -1) return resError(res, 404, 'Undefined direction inserted.');
	else req.vote = req.params.direction;
	return next();
};

module.exports.isAdmin = (req, res, next) => {
	return new Promise((resolve, reject) => {
		const token = req.headers['x-access-token'];
		const decoded = jwt.verify(
			token,
			publicKey,
			{algorithms: ['HS512']},
			(error, decoded) => {
				if(error) return resError(res, 401, 'Invalid Token.');
				if(decoded.isAdmin) return resolve();
				return resError(res, 401, null);
			}
		);
	}).then(() => {
		return next();
	}).catch(err => {
		return next(err);
	});
};

module.exports.verifyToken = (req, res, next) => {
	decodeToken(req, res, next)
	.then((decoded) => {
		return next();
	})
	.catch((err) => {
		return next(err);
	});
};

module.exports.verifyUser = (req, res, next) => {
	decodeToken(req, res, next)
	.then((decoded) => {
		if(decoded.asAdmin) return next();
		if(req.params.username !== decoded.username) return resError(res, 401, null);
		else return next();
	})
	.catch((err) => {
		return next(err);
	});
};

module.exports.verifyAdmin = (req, res, next) => {
	decodeToken(req, res, next)
	.then((decoded) => {
		if(req.params.adminUsername !== decoded.username) return resError(res, 401, null);
		else return next();
	})
	.catch((err) => {
		return next(err);
	});
};