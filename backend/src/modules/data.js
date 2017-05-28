const request = require('request');
const moment = require('moment-timezone');
const timelinejs = require('pebble-timeline-js-node');

const config = require('../common/config.js');
const log = require('../common/log.js');
const plural = require('../common/plural.js');

config.requireKeys('data.js', {
  ENV: {
    PUSH_TO_PRODUCTION: true,
    API_KEY_PROD: '',
    API_KEY_SANDBOX: ''
  }
});

const TOPIC_HEADLINES = 'headlines';
const MAX_PUSHED = 1;  // Max pins pushed each INTERVAL. Prevents infamous timeline blob db errors.
const MAX_DUPLICATES = 100;  // Max 'already pushed' stories

var gDuplicateBuffer = [];  // Check new stories against the last MAX_DUPLICATES to prevent hour-later duplucates
var gWillCacheFirstData = true;  // Don't post pins right away - stateful

/////////////////////// Unsafe iteration on array indexes //////////////////////
function printBufferSize() {
  var counter = 0;
  for(var i = 0; i < gDuplicateBuffer.length; i++) {
    if(gDuplicateBuffer[i]) counter += 1;
  }
  log.debug(`printBufferSize(): There are ${counter} items in the duplicate buffer`);
}

function isDuplicate(story) {
  for(var i = 0; i < MAX_DUPLICATES; i += 1) {
    if(gDuplicateBuffer[i]) {
      if(story.title == gDuplicateBuffer[i].title) return true;
    }
  }
  return false;
}
////////////////////////////////////// END /////////////////////////////////////

function decode(str) {
  str = str.replace(/&amp;/g, '&');
  str = str.replace('<![CDATA[', '');
  str = str.replace(']]>', '');
  return str;
}

function parseFeed(xml) {
  const items = [];
  var longestTitle = 0;
  var longestDesc = 0;

  var max;
  if(gWillCacheFirstData) max = 30;
  else max = MAX_PUSHED;

  while(xml.includes('<title>') && items.length < max) {  // May take 3 INTERVALs for full saturation
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
    const story = { 
      title: title, 
      description: desc, 
      date: date, 
      source: 'BBC News' 
    };

    // Check for duplicates
    if(!isDuplicate(story)) {
      // Add to buffer of recent duplicates
      for(var i = MAX_DUPLICATES - 1; i > 0; i--) {
        // Shift up
        if(i != 0) gDuplicateBuffer[i] = gDuplicateBuffer[i - 1];
      }

      gDuplicateBuffer[0] = story;
      items.push(story);
      log.debug(`Added new story: ${story.title}`);
    }

    xml = xml.substring(xml.indexOf('</description>') + '</description>'.length);
  }

  printBufferSize();
  log.debug(`parseFeed(): Extracted ${items.length} items.`);
  return items;
};

function download() {
  request('http://feeds.bbci.co.uk/news/rss.xml', (error, response, body) => {
    log.debug('request(): Response from BBC obtained!');

    // Strip metadata
    body = body.substring(body.indexOf('<item>') + '<item>'.length);
    const stories = parseFeed(body);

    if(gWillCacheFirstData) {
      gWillCacheFirstData = false;
      log.debug('request(): Caching only for first run.');
    } else {
      // Push pins
      log.debug(`request(): Pushing ${stories.length} new pins.`);

      for(var i = 0; i < stories.length; i++) {
        const pubDate = moment(stories[i].date);

        var pin = {
          id: 'bbcnews-story-' + pubDate.unix(),
          time: pubDate.toDate(),
          layout: {
            type: 'genericPin',
            tinyIcon: 'system://images/NEWS_EVENT',
            title: stories[i].title,
            subtitle: stories[i].source,
            body: stories[i].description,
            foregroundColor: '#FFFFFF',
            backgroundColor: '#AA0000'
          }
        };
        log.debug(`pin=${JSON.stringify(pin)}`);

        // Push pins to sandbox and production
        if(config.ENV.PUSH_TO_PRODUCTION) {
          timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.ENV.API_KEY_PROD, (responseText) => {
            log.debug(`timelineRequest(): Production pin push result: ${responseText}`);
          });
        }
        timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.ENV.API_KEY_SANDBOX, (responseText) => {
          log.debug(`timelineRequest(): Sandbox pin push result: ${responseText}`);
        });  

        plural.post('news_headlines__latest', `${pin.layout.title} - ${pin.layout.body}`);
      }
    }
    log.debug(`Last updated: ${new Date().toISOString()}`);
  });
  log.debug('request(): request sent');
};

module.exports = {
  download: download
};
