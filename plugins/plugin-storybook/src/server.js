const om = require('@mrbuilder/cli').default;
const {enhancedResolve} = require('@mrbuilder/utils');
const isDevServer = om.config('@mrbuilder/plugin-storybook.isDevServer');
if (isDevServer) {
    process.env.NODE_ENV = 'development';
}

const server = require("@storybook/core/server");
const path = require('path');
const config = (key, def) => om.config(`@mrbuilder/plugin-storybook.${key}`, def);
const staticDir = om.config('@mrbuilder/cli.publicDir', om.cwd('public'));
const options = require(`@storybook/${config('type', 'react')}/dist/server/options`).default;

const serverOptions = {
    ...options,
    configDir: config('configDir', path.join(__dirname, 'config')),
    staticDir: config('staticDir', Array.isArray(staticDir) ? staticDir : staticDir ? [staticDir] : null),
    ...[
        'port',
        'host',
        'sslCa',
        'sslCert',
        'sslKey',
        'dll',
        'ci',
        'smokeTest',
        'quiet',
        'host',
        'ignorePreview',
        'docs',
        'frameworkPresets',
        'previewUrl',

    ].reduce((r, k) => {
        const v = config(k);
        if (v != null) {
            r[k] = config(k);
        }
        return r;
    }, {}),
};
if (!isDevServer) {
    config.outputDir = enhancedResolve(config('outputDir', 'storybook-static'));
}
server[isDevServer ? 'buildDev' : 'buildStatic'](serverOptions);