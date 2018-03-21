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
let localTemp = {};

router.param('postID', (req, res, next, postID) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${req.params.postID}`,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		json: true
	})
	.then(body => {
		localTemp.post = body;
		next();
	})
	.catch(err => next(err));
});
router.param('commentID', (req, res, next, commentID) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${localTemp.post._id}/comments/${req.params.commentID}`,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		json: true
	})
	.then(body => {
		localTemp.post.comment = body;
		next();
	})
	.catch(err => next(err));
});

router.route('/')
.get((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts`,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		json: true
	})
	.then(body => {
		res.render('posts.pug', {
			title: 'All your posts',
			posts: body
		});
	})
	.catch(err => next(err));
})
.post((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts`,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		body: {
			content: req.body.content,
		},
		json: true
	})
	.then(body => {
		res.render('posts.pug', {
			title: 'Your Selected post',
			username: req.session.user.username,
			posts: body
		});
	})
	.catch(err => reject(err));
});

router.route('/:postID')
.get((req, res, next) => {
	res.render('posts.pug', {
		title: 'Your Selected post',
		posts: [localTemp.post]
	});
})
.put((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${postID}`,
		method: 'PUT',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		body: {
			content: req.body.content,
		},
		json: true
	})
	.then(body => localTemp.post = body)
	.catch(err => reject(err));
})
.delete((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${postID}`,
		method: 'DELETE',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		json: true
	})
	.then(body => {

	})
	.catch(err => reject(err));
});

router.route('/:postID/comments')
.get((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${postID}/comments`,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		json: true
	})
	.then(body => {
		res.render('comments', {
			title: `Your post's comments`,
			comments: body
		});
	})
	.catch(err => next(err));
})
.post((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${postID}/comments`,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		body: {
			content: req.body.content
		},
		json: true
	})
	.then(data => {
		res.render('comments', {
			title: `Your post's comments`,
			comments: data
		});
	})
	.catch(err => next(err));
});

router.route('/:postID/comments/:commentID')
.get((req, res, next) => {
	res.render('comments', {
		title: `Your post's comments`,
		comments: [localTemp.post.comment]
	});
})
.put((req, res, next) => {
	request({
		url: `http://${HOST}:${PORT}/users/${req.session.user.username}/posts/${postID}/comments/${commentID}`,
		method: 'PUT',
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'x-access-token': req.session.token
		},
		body: {
			content: req.body.content,
		},
		json: true
	})
	.then(body => localTemp.post.comment = body)
	.catch(err => reject(err));
})
.delete((req, res, next) => {

});

module.exports = router;