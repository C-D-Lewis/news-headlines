const request = require('request');
const moment = require('moment-timezone');
const timelinejs = require('pebble-timeline-js-node');

const config = require('../common/config');
const log = require('../common/log');
const plural = require('../common/plural');
const scraper = require('../common/scraper');

config.requireKeys('data.js', {
  ENV: {
    API_KEY_PROD: '',
    API_KEY_SANDBOX: ''
  }
});

const MAX_PUSHED = 1;  // Max pins pushed each INTERVAL. Prevents infamous timeline blob db errors.
const MAX_DUPLICATES = 50;  // Max 'already pushed' stories

var dupeBuffer = [];  // Check new stories against the last MAX_DUPLICATES to prevent hour-later duplucates
var cacheFirst = true;  // Don't post pins right away - stateful

function decode(str) {
  str = str.split(/&amp;/g).join('&');
  str = str.split('<![CDATA[').join('');
  return str.split(']]>').join('');
}

function getStories(xml) {
  const items = [];
  xml = xml.split('<item>');
  xml.shift();
  xml.map((xmlChunk) => {
    const story = {
      title: decode(scraper.scrape(xmlChunk, [ '<title>' ], '</title>')),
      description: decode(scraper.scrape(xmlChunk, [ '<description>' ], '</description>')),
      date: scraper.scrape(xmlChunk, [ '<pubDate>' ], '</pubDate>')
    };

    if(!dupeBuffer.find((dupe) => dupe.title === story.title)) {
      dupeBuffer.unshift(story);
      if(dupeBuffer.length > MAX_DUPLICATES) dupeBuffer.pop();
     
      items.push(story);
      log.debug(`Added new story: \n${story.title}\n${story.description}\n`);
    }
  });

  log.debug(`There are ${dupeBuffer.length} items in the duplicate buffer`);
  log.info(`Extracted ${items.length} items.`);
  return items;
};

function pushPin(stories, index) {
  const pubDate = moment(stories[index].date);
  var pin = {
    id: 'bbcnews-story-' + pubDate.unix(),
    time: pubDate.toDate(),
    layout: {
      type: 'genericPin',
      tinyIcon: 'system://images/NEWS_EVENT',
      title: stories[index].title,
      subtitle: 'BBC News',
      body: stories[index].description,
      foregroundColor: '#FFFFFF',
      backgroundColor: '#AA0000'
    }
  };
  log.debug(`pin=${JSON.stringify(pin)}`);

  const TOPIC = 'headlines';
  timelinejs.insertSharedPin(pin, [ TOPIC ], config.ENV.API_KEY_PROD, log.info);
  timelinejs.insertSharedPin(pin, [ TOPIC ], config.ENV.API_KEY_SANDBOX, log.info); 
  plural.post('news_headlines__latest', `${pin.layout.title} - ${pin.layout.body}`);
}

function download() {
  request.get('http://feeds.bbci.co.uk/news/rss.xml', (err, response, body) => {
    if(cacheFirst) {
      log.info('Caching on first run');
      cacheFirst = false;
    } else {
      const stories = getStories(body);
      if(stories.length < 1) return;

      for(var i = 0; i < MAX_PUSHED; i++) pushPin(stories, i);
    }
  });
};

module.exports = {
  download: download
};
