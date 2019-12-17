if (!global._MRBUILDER_STYLEGUIDE_CONFIG){
    throw new Error('_MRBUILDER_STYLEGUIDE_CONFIG was not defined, probably not running through the styleguidist cli');
}
const om = require('@mrbuilder/cli').default;
const fs = require('fs');

module.exports = {
    ...global._MRBUILDER_STYLEGUIDE_CONFIG
};