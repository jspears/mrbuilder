require('./babel-polyfill');
module.exports = require(`@mrbuilder/plugin-babel-${require('./version')}/babel-register`);
