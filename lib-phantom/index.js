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

  // By convention, a meta tag with attribute 'data-num-pages-to-exclude' can provide num of pages to exclude
  // TODO: Find a non-hacky and more robust way to do this.
  var pageIgnoreMatches = page.content.match(/data-num-pages-to-exclude="([0-9]+)/);
  var numOfPagesToIgnore = pageIgnoreMatches && pageIgnoreMatches[1] ? pageIgnoreMatches[1] : 0;
  var phantomFooterCallback = function(pageNum, numPages) {
    if (pageNum === 1) { return ''; }
    numPages = numPages - numOfPagesToIgnore;
    return _.template(args.footerTemplate)({ pageNum: pageNum, numPages: numPages });
  };

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
