function compare(context, parentKey, spec, query) {
  for(var key in spec) {
    const value = spec[key];
    if(!query.hasOwnProperty(key)) {
      console.log(`${context}: key '${key}' not found in ${parentKey}. Found ${JSON.stringify(query)}`);
      return false;
    }

    if(typeof value === 'object' && !Array.isArray(value)) compare(context, key, value, query[key]);
  }
  
  return true;
};

module.exports = compare;
