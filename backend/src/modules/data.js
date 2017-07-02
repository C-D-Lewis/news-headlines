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

const MAX_PUSHED = 1;  // Max pins pushed each INTERVAL. Prevents infamous timeline blob db errors.
const MAX_DUPLICATES = 100;  // Max 'already pushed' stories
const MAX_READ = 20;

var dupeBuffer = [];  // Check new stories against the last MAX_DUPLICATES to prevent hour-later duplucates
var cacheFirst = false;  // Don't post pins right away - stateful

function decode(str) {
  str = str.split(/&amp;/g).join('&');
  str = str.split('<![CDATA[').join('');
  str = str.split(']]>').join('');
  return str;
}

function getStories(xml) {
  const items = [];

  var maxItems;
  if(cacheFirst) maxItems = MAX_READ;
  else maxItems = MAX_PUSHED;

  while(xml.includes('<item>') && items.length < maxItems) {
    xml = xml.substring(xml.indexOf('<item>'));

    var title = xml.substring(xml.indexOf('<title>') + '<title>'.length);
    title = title.substring(0, title.indexOf('</title>'));
    xml = xml.substring(xml.indexOf('</title>') + '</title>'.length);

    var desc = xml.substring(xml.indexOf('<description>') + '<description>'.length);
    desc = desc.substring(0, desc.indexOf('</description>'));

    var date = xml.substring(xml.indexOf('<pubDate>') + '<pubDate>'.length);
    date = date.substring(0, date.indexOf('</pubDate>'));

    const story = { 
      title: decode(title), 
      description: decode(desc), 
      date: date, 
      source: 'BBC News' 
    };

    if(!dupeBuffer.find((dupe) => dupe.title === story.title)) {
      dupeBuffer.unshift(story);
      if(dupeBuffer.length > MAX_DUPLICATES) dupeBuffer.pop();
      
      items.push(story);
      log.debug(`Added new story: ${story.title}`);
    }

    xml = xml.substring(xml.indexOf('</item>') + '</item>'.length);
  }

  log.debug(`There are ${dupeBuffer.length} items in the duplicate buffer`);
  log.info(`Extracted ${items.length} items.`);
  return items;
};

function download() {
  request.get('http://feeds.bbci.co.uk/news/rss.xml', (err, response, body) => {
    const stories = getStories(body);

    if(cacheFirst) cacheFirst = false;
    else {
      log.debug(`Pushing ${stories.length} new pins.`);
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

        // Push pins to timeline sandbox, production, and plural
        const TOPIC = 'headlines';
        if(config.ENV.PUSH_TO_PRODUCTION) {
          timelinejs.insertSharedPin(pin, [ TOPIC ], config.ENV.API_KEY_PROD, (res) => {
            log.debug(`Production pin push result: ${res}`);
          });
        }
        timelinejs.insertSharedPin(pin, [ TOPIC ], config.ENV.API_KEY_SANDBOX, (res) => {
          log.debug(`Sandbox pin push result: ${res}`);
        });  
        plural.post('news_headlines__latest', `${pin.layout.title} - ${pin.layout.body}`);
      }
    }
  });
};

module.exports = {
  download: download
};
