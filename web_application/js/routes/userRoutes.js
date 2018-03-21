'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request-promise');
const express = require('express');
const resError = require('../respond-error');
const middleware = require('../middleware');
const HOST = require('../../localData/API_address.json').HOST;
const PORT = require('../../localData/API_address.json').PORT;

const router = express.Router();

router.route('/')
.get((req, res, next) => {
	res.render('profile', {
		title: 'Profile'
	});
})
.put((req, res, next) => {

})
.delete((req, res, next) => {

});

router.use('/posts', require('./postRoutes'));

module.exports = router;