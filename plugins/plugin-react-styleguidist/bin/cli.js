#!/usr/bin/env node
const om = require('@mrbuilder/cli').default;

const arg = (om.config("@mrbuilder/cli.isDevServer")) ? 'server' : 'build';

const {argv} = process;

if (!(argv.includes('server', 2) || arg.includes('build', 2))) {
    argv.push(arg);
}

if (!(argv.includes('--config', 2) || argv.includes('-c', 2))) {
    argv.push('--config', `${__dirname}/../styleguide.config.js`);
}
//So the config bits of styleguide do not handle async, so this hacks that.
require('@mrbuilder/plugin-webpack/webpack.config.js').then(webpackConfig => {
    return require('@mrbuilder/plugin-react-styleguidist/src/updateConfig')().then(styleguide => {
        global._MRBUILDER_STYLEGUIDE_CONFIG = {
            webpackConfig,
            ...styleguide
        };
        require('react-styleguidist/lib/bin/styleguidist');
    });
});

