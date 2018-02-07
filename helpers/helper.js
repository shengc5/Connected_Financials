module.exports = {

	/* 
	Takes in complete dataset sent back by Plaid API, strips out useless infomartion,
	only keep ones we need for later use
	*/
	getUsefulData: function (fullData) {
		var usefulData = {};
		usefulData.accounts = fullData.accounts;
		usefulData.institution = fullData.item.institution_id;
		usefulData.total_transactions = usefulData.total_transactions;
		usefulData.transactions = [];
		fullData.transactions.forEach(function (curObj) {
            usefulData.transactions[usefulData.transactions.length] = {
				amount: curObj.amount,
				category: curObj.category,
				date: curObj.date,
				location: curObj.location.city,
				state: curObj.location.state,
				name: curObj.name,
			}
		});
		return usefulData;
	},

	/*
	For d3.js to use: extract each category and its number of transaction. Write the data 
	to a csv file, and return the maximum count
	*/
	extractAndWrite: function (transData) {
		var maxCount = 0;
		var json2csv = require('json2csv');
		var fs = require('fs');
		var weights = {};
		transData.transactions.forEach(function (curObj) {
			if (curObj.category !== undefined && curObj.category !== null) {
				curObj.category.forEach(function (curCategory) {
					if (weights[curCategory] === undefined) {
						weights[curCategory] = 1;
					} else {
						weights[curCategory] = weights[curCategory] + 1;
					}
				});
			}
		});
		var weightsArr = [];
		for (var curCategory in weights) {
			if (weights[curCategory] > maxCount) {
				maxCount = weights[curCategory];
			}
			if (weights.hasOwnProperty(curCategory)) {
				weightsArr[weightsArr.length] = {
					category: curCategory,
					count: weights[curCategory],
				}
			}
		}
		var weightsArrHeader = ["category", "count"];
		try {
			var result = json2csv({
				data: weightsArr,
				fields: weightsArrHeader
			});
			fs.writeFile('./public/trans.csv', result, function (err) {
				if (err) throw err;
				console.log('file saved');
			});
		} catch (err) {
			console.error(err);
		}
		return maxCount;
	},

	/*
	For Highchart pie chart: construct an array of category and its corresponding amount spent
	and number of transactions. Encode it as string so the template can later parse and use it
	*/
	pieData: function (transData) {
		var weights = {};
		var spendings = {};
		transData.transactions.forEach(function (curObj) {
			if (curObj.category !== undefined && curObj.category !== null) {
				curObj.category.forEach(function (curCategory) {
					if (weights[curCategory] === undefined) {
						weights[curCategory] = 1;
					} else {
						weights[curCategory] = weights[curCategory] + 1;
					}
					if (spendings[curCategory] === undefined) {
						spendings[curCategory] = curObj.amount;
					} else {
						spendings[curCategory] = spendings[curCategory] + curObj.amount;
					}
				});
			}

		});
		var resArr = [];
		for (var curCategory in weights) {
			if (weights.hasOwnProperty(curCategory)) {
				resArr[resArr.length] = {
					name: curCategory,
					z: weights[curCategory],
					y: spendings[curCategory],
				}
			}
		}
		return encodeURIComponent(JSON.stringify(resArr));
	},

	/*
	For Highchart line chart: compute the amount of spendings on each day, reformat the 
	date to something highchart understands, and return the array
	*/
	areaData: function (transData) {
		var dailyData = [];
		var daily = {};
		transData.transactions.forEach(function (curObj) {
			if (curObj.date !== undefined && curObj.date !== null) {
				if (daily[curObj.date] === undefined) {
					daily[curObj.date] = curObj.amount;
				} else {
					daily[curObj.date] = daily[curObj.date] + curObj.amount;
				}
			}
		});
		for (var curDate in daily) {
			if (daily.hasOwnProperty(curDate)) {
				if (daily[curDate] >= 0) {
					var dateFormatted = curDate.replace("-", "/").replace("-", "/");
					dailyData.unshift([
						new Date(curDate).getTime(),
						daily[curDate]
					]);
				}

			}
		}
		return dailyData;
	}
}