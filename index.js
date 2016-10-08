'use strict';

const got = require('got');
const cookie = require('cookie');
const $ = require('cheerio');
const pjson = require('./package.json');

module.exports = (PluginContext) => {
	const app = PluginContext.app;
	const shell = PluginContext.shell;
	const prefix = pjson.hain.prefix;
	var do_search = 0;
	
	function search(query, res) {
		var query_trim = query.trim();
		if (do_search == 0)
		{
			res.add({
			  icon: "#fa fa-search",
			  id: query_trim,
			  payload: "search",
			  title: `Press Enter to search ${query_trim} on ThePirateBay`,
			  desc: ""
			});
			return 0;
		}
		do_search = 0;
		var url = `https://thepiratebay.org/search/${query_trim}/0/7/0`;
		res.add({
			id: '__temp',
			title: 'fetching...',
			desc: 'from The Pirate Bay',
			icon: '#fa fa-circle-o-notch fa-spin'
		});
		got(url, {
			headers: {
				cookie: cookie.serialize("lw", "s")
			}
		}).then(response => {
			var results = $(response.body).find("#searchResult tr").toArray();
			if (results.length == 0)
			{
				res.remove('__temp');
				res.add({
					title: `No results for ${query_trim}`,
					icon: '#fa fa-times'
				});
			}
			else
			{
				results.shift();
				if (query_trim.length == 0)
					results.pop();
				var res_temp = [];
				$(results).each(function (index, element) {
					var data = $(element).find("td").toArray();
					var img = $(data[3]).find("a:last-child img").attr("src");
					var header = "";
					if (!!img)
					{
						if (img.indexOf("trusted") != -1)
							header = "<span style='border-radius: 5px; background-color: fuchsia; color: #ffffff; padding: 2px'>Trusted</span> ";
						else if (img.indexOf("vip") != -1)
							header = "<span style='border-radius: 5px; background-color: green; color: #ffffff; padding: 2px'>VIP</span> ";
					}
					res_temp.push({
					  icon: '#fa fa-magnet',
					  id: $(data[3]).find("a").attr("href"),
					  payload: 'open',
					  title: $(data[1]).text(),
					  desc: header + $(data[0]).text()+" | "+$(data[2]).text()+" | "+$(data[4]).text()+" | S:"+$(data[5]).text()+" L:"+$(data[6]).text(),
					});
				});
				res.remove('__temp');
				res.add(res_temp);
			}
		});
	}

	function execute(id, payload) {
		if (payload == "open")
		{
			shell.openExternal(id);
			return 0;
		}
		if (payload == "search") {
			do_search = 1;
			app.setQuery(prefix+" "+id);
			return 0;
		}
	}

	return {search, execute};
};
