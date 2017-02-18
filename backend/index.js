var express = require('express');
// var imagemagick = require('imagemagick-native');
var moment = require('moment-timezone');
var request = require('request');
var timelinejs = require('pebble-timeline-js-node');

var config = require('./config.json');
var plural = require('./util/plural.js');

/*********************************** Config ***********************************/

// TODO Clean up this config
// TODO Clean up logging

var DEBUG = true;  // More logging
var LOG_PINS = true;  // Log pin contents
var PUSH_TO_PRODUCTION = true;
var MAX_PUSHED = 1;  // Max pins pushed each INTERVAL. Prevents infamous timeline blob db errors.
var INTERVAL_MINS = 240;  // Minutes between update interval
var INTERVAL = INTERVAL_MINS * 1000 /* seconds */ * 60 /* minutes */;
var MAX_DUPLICATES = 100;  // Max 'already pushed' stories

var TOPIC_HEADLINES = 'headlines';
// var TOPIC_HEADLINES_NOTIFS = 'headlines-notifs';

/************************************* Data ***********************************/

var gDuplicateBuffer = [];  // Check new stories against the last MAX_DUPLICATES to prevent hour-later duplucates
var gWillCacheFirstData = true;  // Don't post pins right away

/************************************ Util ************************************/

function debug(message) {
  if(DEBUG) console.log(message);
}

/******************************** Feed parsing ********************************/

function printBufferSize() {
  var counter = 0;
  for(var i = 0; i < gDuplicateBuffer.length; i+=1) {
    if(gDuplicateBuffer[i] != undefined) {
      counter += 1;
    }
  }
  debug('printBufferSize(): There are ' + counter + ' items in the duplicate buffer');
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

var parseFeed = function(responseText) {
  var items = [];
  var longestTitle = 0;
  var longestDesc = 0;

  var max;
  if(gWillCacheFirstData) {
    // Cache max amount
    max = 30; // Safe count of typical feed length. May be 30
  } else {
    max = MAX_PUSHED;
  }

  while(responseText.indexOf('<title>') > 0 && items.length < max) {  // May take 3 INTERVALs for full saturation
    // Title
    var title = responseText.substring(responseText.indexOf('<title>') + '<title>'.length);
    title = title.substring(0, title.indexOf('</title>'));
    responseText = responseText.substring(responseText.indexOf('</title>') + '</title>'.length);
    title = decode(title);

    // Description
    var desc = responseText.substring(responseText.indexOf('<description>') + '<description>'.length);
    desc = desc.substring(0, desc.indexOf('</description>'));
    desc = decode(desc);

    // Date
    var date = responseText.substring(responseText.indexOf('<pubDate>') + '<pubDate>'.length);
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
      // Add this
      gDuplicateBuffer[0] = s;
      debug('Added new story: ' + s.title);

      items.push(s);
    }

    // Next
    responseText = responseText.substring(responseText.indexOf('</description>') + '</description>'.length);
  }

  printBufferSize();
  debug('parseFeed(): Extracted ' + items.length + ' items.');
  return items;
};

/********************************* Pin pushing ********************************/

function download() {
  request('http://feeds.bbci.co.uk/news/rss.xml', function(error, response, responseText) {
    debug('request(): Response from BBC obtained!');

    // Strip metadata
    responseText = responseText.substring(responseText.indexOf('<item>') + '<item>'.length);
    var stories = parseFeed(responseText);

    if(gWillCacheFirstData == true) {
      debug('request(): Caching only for first run.');
      gWillCacheFirstData = false;
    } else {
      // Push pins
      debug('request(): Pushing ' + stories.length + ' new pins.');

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

        if(LOG_PINS) {
          console.log(JSON.stringify(pin));
        }

        // Removed due to alert unreliability (08-2015)
        // var pinNotif = {
        //   'id': 'bbcnews-story-' + pubDate.unix() + '-notif',
        //   'time': pubDate.toDate(),
        //   'layout': {
        //     'type': 'genericPin',
        //     'tinyIcon': 'system://images/NEWS_EVENT',
        //     'title': stories[i].title,
        //     'subtitle': stories[i].source,
        //     'body': stories[i].description,
        //     'foregroundColor': '#FFFFFF',
        //     'backgroundColor': '#AA0000'
        //   },
        //   'createNotification': {
        //     'layout': {
        //       'type': 'genericNotification',
        //       'tinyIcon': 'system://images/NEWS_EVENT',
        //       'title': stories[i].source,
        //       'subtitle': stories[i].title,
        //       'foregroundColor': '#000000',
        //       'backgroundColor': '#AA0000'
        //     }
        //   }
        // };

        // Push pins to sandbox and production
        if(PUSH_TO_PRODUCTION) {
          timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.API_KEY_PROD, function(responseText) {
            debug('timelineRequest(): Production pin push result: ' + responseText);
          });
          // timelineRequest(pinNotif, 'PUT', [TOPIC_HEADLINES_NOTIFS], config.API_KEY_PROD, function(responseText) {
          //   debug('timelineRequest(): Production pin with notif push result: ' + responseText);
          // });
        }
        timelinejs.insertSharedPin(pin, [TOPIC_HEADLINES], config.API_KEY_SANDBOX, function(responseText) {
          debug('timelineRequest(): Sandbox pin push result: ' + responseText);
        });  
        // timelineRequest(pinNotif, 'PUT', [TOPIC_HEADLINES_NOTIFS], config.API_KEY_SANDBOX, function(responseText) {
        //   debug('timelineRequest(): Sandbox pin with notif push result: ' + responseText);
        // });

        // Push to Plural
        request(config.IP_URL, function(err, response, body) {
          if(err) {
            console.log('Error getting IP: ' + JSON.stringify(err));
            return;
          }

          var ip = JSON.parse(body).ip;
          var msg = pin.layout.title + ' - ' + pin.layout.body;
          plural.post(ip, 'news_headlines__latest', msg);
        });
      }
    }
    debug('Last updated: ' + new Date().toISOString());
  });
  debug('request(): request sent');
};

/********************************* Images *************************************/

// var downloadBinaryResource = function(imgUrl, callback, failedCallback) {
//   request({'uri': imgUrl, 'encoding': null}, function(error, response, body) {
//     if(error) {
//       failedCallback(error);
//       return;
//     }

//     callback(body);
//   });
// };

// var shiftDown = function(val) {
//   return val >>= 14;  // Magic value that works!
// }

var getPixels = function(png) {
  return [];  // Removed when 144x81 images were removed from the feed

  // From [{r,g,b,a==65535}] to uint8t
  // var info = imagemagick.identify({'srcData': png});
  // debug('info: ' + JSON.stringify(info));

  // var arr = imagemagick.getConstPixels({
  //   'srcData': png,
  //   'x': 0,
  //   'y': 0,
  //   'columns': info.width,
  //   'rows': info.height
  // });

  // // Convert palette
  // for(var i = 0; i < arr.length; i += 1) {
  //   var c = arr[i];
  //   c.red = shiftDown(c.red);
  //   c.green = shiftDown(c.green);
  //   c.blue = shiftDown(c.blue);

  //   var b = 0xC0; // 11000000
  //   b = b | (c.red << 4);
  //   b = b | (c.green << 2);
  //   b = b | c.blue;
  //   arr[i] = b; // Replace value
  // }

  // // Convert to array
  // var result = [];
  // var uint_arr = new Uint8Array(arr);
  // for(var i = 0; i < uint_arr.byteLength; i += 1) {
  //   result.push(uint_arr[i]);
  // }

  // return result;
}

/******************************** Express *************************************/

var app = express();

app.set('port', config.PORTS.THIS);

app.get('/convert', function(req, res) {
  debug('[' + new Date().toString() + '] Convert requested: ' + req.query.url);
  var start = new Date().getTime();

  debug('Imagemagick is removed, doing nothing.');
  res.send([0,0,0]);

  // request({'uri': req.query.url, 'encoding': null}, function(error, response, body) {
  //   if(!error) {
  //     try {
  //       var png = imagemagick.convert({
  //         'srcData': body,
  //         'srcFormat': 'jpg',
  //         'format': 'png'
  //       });

  //       var pixels = getPixels(png);

  //       res.send(pixels);

  //       var finish = new Date().getTime();
  //       debug('Sent after ' + (finish - start) + ' ms.');
  //     } catch(error) {
  //       debug('Error converting image: ' + error);
  //       var result = [0, 0, 0];
  //       res.send(result);
  //     }
  //   } else {
  //     debug('Error downloading image data: ' + error);
  //   }
  // });
});

app.get('/status', function(req, res) {
  debug('[' + new Date().toString() + '] Status requested.');

  res.setHeader('Content-Type', 'text/html');
  res.write('OK\n');
  res.end();
});

app.listen(app.get('port'), function() {
  debug('Node app is running at localhost:' + app.get('port'));

  setInterval(function() {
    debug('Updating...');
    download();
  }, INTERVAL);
  download();
});
