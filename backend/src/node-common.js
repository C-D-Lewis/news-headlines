const NODE_COMMON_DIR = `${__dirname}/../../../../node-common/`;
[ 'boot', 'compare', 'config', 'db', 'eventBus', 'extract', 'fcm', 'gistSync', 
  'ip', 'ledServerClient', 'leds', 'log', 'mbus', 'motePhat', 'server',
  'testBed' 
].forEach((item) => module.exports[item] = () => require(NODE_COMMON_DIR + item));
