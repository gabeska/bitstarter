#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function (infile) {
	var instr = infile.toString();
	if (!fs.existsSync(instr)) {
		console.log("%s does not exists. Exiting.", instr);
		process.exit(1);
	}
	return instr;
};

var cheerioHtmlFile = function (htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function (checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};
/*
var checkHtmlFileOld = function (htmlfile, checksfile) {
	var $ = cheerioHtmlFile(htmlfile),
		checks = loadChecks(checksfile).sort(),
		out = {};
	for (var ii in checks) {
		var present = $(checks[ii]).length>0;
		out[checks[ii]] = present;
	}
	return out;
};
*/

var checkHtmlFile = function (htmlfile, checksfile) {
    var htmlString = fs.readFileSync(htmlfile);
    return checkHtmlString(htmlString, checksfile);
}

var checkHtmlString = function (htmlString, checksfile) {
    var $ = cheerio.load(htmlString);
    var checks = loadChecks(checksfile).sort();
    var out = {};

    for (var ii in checks) {
	var present = $(checks[ii]).length>0;
	out[checks[ii]] = present;
    }
    return out;

};

var clone = function (fn) {
	// workaround for commander.js issue.
	// http://stackoverflow.com/a/6772648
	return fn.bind({});
};
var retrieveURLAndCheck = function(url, checksfile) {
    // console.log('going to retrieve '+url);
    restler.get(url).on('success', function(data, response) {
	// console.log('success retrieving ' +url+ ' with checksfile ' + checksfile);
	var checkJson = checkHtmlString(data.toString(), checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    });
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', "Path to checks.json", clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>','URL to retrieve')
	.parse(process.argv);

    if(program.url) {
	retrieveURLAndCheck(program.url, program.checks);
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson,null,4);
	console.log(outJson) ;
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
