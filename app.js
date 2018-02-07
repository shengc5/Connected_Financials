var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');
var jsonfile = require('jsonfile');
var keys = require('./config/keys');
var path = require('path');
var mongoose = require('mongoose');
var exphbs = require('express-handlebars');

var APP_PORT = process.env.PORT || 8000;;
var PLAID_CLIENT_ID = keys.PLAID_CLIENT_ID;
var PLAID_SECRET = keys.PLAID_SECRET;
var PLAID_PUBLIC_KEY = keys.PLAID_PUBLIC_KEY;
var PLAID_ENV = 'development';

var ACCESS_TOKEN = null;
var PUBLIC_TOKEN = null;
var ITEM_ID = null;
var localUser = null;
var transData = null;

var client = new plaid.Client(
	PLAID_CLIENT_ID,
	PLAID_SECRET,
	PLAID_PUBLIC_KEY,
	plaid.environments[PLAID_ENV]
);

var {
	getUsefulData,
	extractAndWrite,
	pieData,
	areaData
} = require('./helpers/helper.js');


mongoose.Promise = global.Promise;
// mongoose connect
mongoose.connect(keys.mLabURI, {}).then(() => console.log('mongodb mckinsey_intern is running'))
	.catch(err => console.log(err));

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

var ensureLogin = function (req, res, next) {
	if (transData === null) {
		res.redirect('/');
	} else {
		return next();
	}
}

app.get('/', function (request, response, next) {
    console.log("/ called");
	response.render('login', {
		noside: 'null',
	});
});

app.get('/account', ensureLogin, function (req, res) {
	res.render('account', {
		accounts: transData.accounts,
	});
});

app.get('/transactions', ensureLogin, function (req, res) {
	res.render('transactions', {
		transactions: transData.transactions,
		transLength: transData.transactions.length
	});
});

app.get('/daily', ensureLogin, function (req, res) {
	res.render('daily', {
		hcData: JSON.stringify(areaData(transData)),
		alertLine: localUser.alertLine
	});
})

app.get('/visualize', ensureLogin, function (req, res) {
	res.render('visualize', {
		hcData: JSON.stringify(pieData(transData))
	});
});

app.get('/visualize2', ensureLogin, function (req, res) {
	var maxRadi = extractAndWrite(transData);
	res.render('visualize2', {
		maxRadi: maxRadi
	});
});

app.post('/checkLogin', function (req, res, next) {
	require('./models/User');
	var User = mongoose.model('users');
	User.findOne({
			email: req.body.email
		})
		.then(user => {
			if (user) {
				if (user.password == req.body.password) {
					localUser = {
						email: user.email,
						password: user.password,
						firstName: user.firstName,
						lastName: user.lastName,
						alertLine: user.alertLine,
					}
					res.send("yes");
				} else {
					res.send();
				}
			} else {
				res.send();
			}
		})
})


app.post('/get_access_token', function (request, response, next) {
    console.log("get_access_token called");
	PUBLIC_TOKEN = request.body.public_token;
	client.exchangePublicToken(PUBLIC_TOKEN, function (error, tokenResponse) {
		if (error != null) {
			var msg = 'Could not exchange public_token!';
			console.log(msg + '\n' + JSON.stringify(error));
			return response.json({
				error: msg
			});
		}
		ACCESS_TOKEN = tokenResponse.access_token;
		ITEM_ID = tokenResponse.item_id;
		console.log('Access Token: ' + ACCESS_TOKEN);
		console.log('Item ID: ' + ITEM_ID);
		response.json({
			'error': false
		});
	});
});


app.post('/transactions', function (request, response, next) {
	// Pull transactions for the Item for the last 30 days
    console.log("tranactions called");
	var startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
	var endDate = moment().format('YYYY-MM-DD');
	client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
		count: 250,
		offset: 0,
	}, function (error, transactionsResponse) {
		if (error != null) {
			console.log(JSON.stringify(error));
			return response.json({
				error: error
			});
		}
		transData = getUsefulData(transactionsResponse);
		response.redirect('/account');
	});
});

var server = app.listen(APP_PORT, function () {
	console.log('Server listening on port ' + APP_PORT);
});