var request = require('request');
var moment = require('moment-timezone');
var timelinejs = require('pebble-timeline-js-node');

var config = require('../../config.json');
var log = require('../common/log.js');
var plural = require('../common/plural.js');

var TOPIC_HEADLINES = 'headlines';
// var TOPIC_HEADLINES_NOTIFS = 'headlines-notifs';
var MAX_PUSHED = 1;  // Max pins pushed each INTERVAL. Prevents infamous timeline blob db errors.
var MAX_DUPLICATES = 100;  // Max 'already pushed' stories

var gDuplicateBuffer = [];  // Check new stories against the last MAX_DUPLICATES to prevent hour-later duplucates
var gWillCacheFirstData = true;  // Don't post pins right away - stateful

function printBufferSize() {
  var counter = 0;
  for(var i = 0; i < gDuplicateBuffer.length; i+=1) {
    if(gDuplicateBuffer[i] != undefined) {
      counter += 1;
    }
  }
  log.debug('printBufferSize(): There are ' + counter + ' items in the duplicate buffer');
}

var isDuplicate = function(story) {
  for(var i = 0; i < MAX_DUPLICATES; i += 1) {
    if(gDuplicateBuffer[i] != undefined) {
      if(story.title == gDuplicateBuffer[i].title) {
        return true;
      }
    }
  }
  return false;
}

// Remove stuff we don't want from the feed text
var decode = function(str) {
  str = str.replace(/&amp;/g, '&');
  str = str.replace('<![CDATA[', '');
  str = str.replace(']]>', '');
  return str;
}

var parseFeed = function(xml) {
  var items = [];
  var longestTitle = 0;
  var longestDesc = 0;

  var max;
  if(gWillCacheFirstData) max = 30; // Cache safe max amount
                     else max = MAX_PUSHED;

  while(xml.indexOf('<title>') > 0 && items.length < max) {  // May take 3 INTERVALs for full saturation
    // Title
    var title = xml.substring(xml.indexOf('<title>') + '<title>'.length);
    title = title.substring(0, title.indexOf('</title>'));
    xml = xml.substring(xml.indexOf('</title>') + '</title>'.length);
    title = decode(title);

    // Description
    var desc = xml.substring(xml.indexOf('<description>') + '<description>'.length);
    desc = desc.substring(0, desc.indexOf('</description>'));
    desc = decode(desc);

    // Date
    var date = xml.substring(xml.indexOf('<pubDate>') + '<pubDate>'.length);
    date = date.substring(0, date.indexOf('</pubDate>'));

    // Make object
    var s = { 'title': title, 'description': desc, 'date': date, 'source': 'BBC News' };

    // Check for duplicates
    if(!isDuplicate(s)) {
      // Add to buffer of recent duplicates
      for(var i = MAX_DUPLICATES - 1; i > 0; i-=1) {
        // Shift up
        if(parseInt(i) != 0) {
          gDuplicateBuffer[i] = gDuplicateBuffer[i - 1];
        }
      }

      gDuplicateBuffer[0] = s;
      items.push(s);
      log.debug('Added new story: ' + s.title);
    }

    xml = xml.substring(xml.indexOf('</description>') + '</description>'.length);
  }

  printBufferSize();
  log.debug('parseFeed(): Extracted ' + items.length + ' items.');
  return items;
};

function download() {
  request('http://feeds.bbci.co.uk/news/rss.xml', function(error, response, body) {
    log.debug('request(): Response from BBC obtained!');

    // Strip metadata
    body = body.substring(body.indexOf('<item>') + '<item>'.length);
    var stories = parseFeed(body);

    if(gWillCacheFirstData) {
      gWillCacheFirstData = false;
      log.debug('request(): Caching only for first run.');
    } else {
      // Push pins
      log.debug('request(): Pushing ' + stories.length + ' new pins.');

      for(var i = 0; i < stories.length; i++) {
        var pubDate = moment(stories[i].date);

        var pin = {
          'id': 'bbcnews-story-' + pubDate.unix(),
          'time': pubDate.toDate(),
          'layout': {
            'type': 'genericPin',
            'tinyIcon': 'system://images/NEWS_EVENT',
            'title': stories[i].title,
            'subtitle': stories[i].source,
            'body': stories[i].description,
            'foregroundColor': '#FFFFFF',
            'backgroundColor': '#AA0000'
          }
        };
        log.debug(JSON.stringify(pin));

        // Push pins to sandbox and production
        if(config.ENV.PUSH_TO_PRODUCTION) {
          timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.ENV.API_KEY_PROD, function(responseText) {
            log.debug('timelineRequest(): Production pin push result: ' + responseText);
          });
        }
        timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.ENV.API_KEY_SANDBOX, function(responseText) {
          log.debug('timelineRequest(): Sandbox pin push result: ' + responseText);
        });  

        plural.post('news_headlines__latest', pin.layout.title + ' - ' + pin.layout.body);
      }
    }
    log.debug('Last updated: ' + new Date().toISOString());
  });
  log.debug('request(): request sent');
};

module.exports.download = download;
