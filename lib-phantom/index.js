/* jshint node: true */
'use strict';

var system = require('system')
  , page = require('webpage').create()
  , _ = require('underscore');

var args = [
  'in'
, 'out'
, 'cssPath'
, 'paperFormat'
, 'paperOrientation'
, 'paperBorder'
, 'footerTemplate'
, 'renderDelay'
].reduce(function(args, name, i) {
  args[name] = system.args[i+1];
  return args;
}, {});

page.open(args.in, function(status) {
  if (status == "fail") {
    page.close();
    phantom.exit(1);
    return;
  }

  // By convention, pages to ignore are marked with the class 'excluded-from-page-count'
  var pageIgnoreMatches = page.content.match(/\.excluded-from-page-count/g);
  var numOfPagesToIgnore = pageIgnoreMatches ? pageIgnoreMatches.length : 0;
  var phantomFooterCallback = function(pageNum, numPages) {
    if (pageNum === 1) { return ''; }
    numPages = numPages - numOfPagesToIgnore;
    return _.template(args.footerTemplate)({ pageNum: pageNum, numPages: numPages });
  }

  page.evaluate(function(cssPath) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = cssPath;
    document.querySelector('head').append(css);
  }, args.cssPath);

  page.paperSize = {
    format: args.paperFormat
  , orientation: args.paperOrientation
  , border: JSON.parse(args.paperBorder)
  , footer: {
      height: '0.6in',
      contents: phantom.callback(phantomFooterCallback)
    }
  };

  setTimeout(function () {
    page.render(args.out);
    page.close();
    phantom.exit(0);
  }, parseInt(args.renderDelay, 10));
});
