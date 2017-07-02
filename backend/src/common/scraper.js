const log = require('./log.js');

function scrape(text, beforeArr, after) {
  var index = 0;
  for(var i = 0; i < beforeArr.length; i++) {
    index = text.indexOf(beforeArr[i]);
    if(index === -1) {
      log.error(`Unable to find ${beforeArr[i]} when scraping`);
      return null;
    }
    text = text.substring(index);
  }
  text = text.substring(beforeArr[beforeArr.length - 1].length);
  text = text.substring(0, text.indexOf(after));
  return text;
}

module.exports = {
  scrape: scrape
};
