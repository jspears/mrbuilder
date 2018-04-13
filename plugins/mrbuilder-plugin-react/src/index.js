const path                   = require('path');
const { cwd, resolvePkgDir } = require('mrbuilder-utils');

module.exports = function reactPlugin({
                                          compatMode = false,
                                      }, webpack,
                                      om) {
    if (!webpack.resolve) {
        webpack.resolve = {};
    }
    if (!webpack.resolve.alias) {
        webpack.resolve.alias = {};
    }
    if (compatMode) {
        if (this.isLibrary) {
            (this.warn || console.warn)(
                'compatMode should not be used for libraries results will be unpredictable')
        }
        if (!webpack.resolve.alias['react-internal']) {
            webpack.resolve.alias['react-internal'] = resolvePkgDir('react');
        }
        if (!webpack.resolve.alias['react']) {
            webpack.resolve.alias['react-internal'] =
                path.resolve(__dirname, 'react.js');
        }
        if (!webpack.resolve.alias['react/']) {
            webpack.resolve.alias['react/'] = resolvePkgDir('react');
        }
    } else {
        if (!webpack.resolve.alias['react']) {
            webpack.resolve.alias['react'] = resolvePkgDir('react');
        }
    }

    if (!webpack.resolve.alias['react-dom']) {
        webpack.resolve.alias['react-dom'] = resolvePkgDir('react-dom');
    }

    if (!webpack.resolve.alias['prop-types']) {
        webpack.resolve.alias['prop-types'] = resolvePkgDir('prop-types');
    }

    if (om.enabled('mrbuilder-plugin-html')) {
        const isHot       = om.enabled('mrbuilder-plugin-hot');
        const babelConfig = require('mrbuilder-plugin-babel/babel-config');

        const pkg        = require(cwd('package.json'));
        let entry        = webpack.entry;
        const publicPath = om.config('mrbuilder-plugin-html.publicPath',
            cwd('public'));

        if (!entry) {

            entry = webpack.entry = { index: path.join(publicPath, 'index') };
            try {
                require.resolve(entry.index);
            } catch (e) {

                const index = require.resolve(
                    cwd(pkg.source || pkg.main || './src'));
                this.info(`no entry using "${index}"`);
                entry = webpack.entry = { index };
            }
        }
        const pages     = om.config('mrbuilder-plugin-html.pages');
        const exported  = om.config('mrbuilder-plugin-html.exported');
        const elementId = om.config('mrbuilder-plugin-html.elementId',
            'content');

        this.info('pages', pages);

        const { generateHot, generate } = require('./loader');

        const keys = pages ? Object.keys(pages) : Object.keys(entry);

        keys.forEach(name => {
            const page = pages && pages[name] || {};
            const hot  = ('hot' in page) ? page.hot : isHot;

            const preEntry = hot ? om.config('mrbuilder-plugin-hot.preEntry',
                ['react-hot-loader/patch']) : [];

            if (('exported' in page) ? page.exported : exported) {
                this.info('expecting a react component to be exported from ',
                    name);
                const val          = webpack.entry[name];
                const current      = Array.isArray(val) ? val[val.length - 1]
                                                        : val;
                const currentAlias = `mrbuilder-plugin-react-${name}`;

                webpack.resolve.alias[currentAlias] = current;


                webpack.entry = Object.assign({},
                    webpack.entry,
                    {
                        [name]: [
                            ...preEntry,
                            `babel-loader?${JSON.stringify(
                                babelConfig)}!mrbuilder-plugin-react/src/loader?${JSON.stringify(
                                {
                                    name     : currentAlias,
                                    hot,
                                    elementId: page.elementId || elementId,
                                    exported : page.exported || exported

                                })}!${current}?exported`
                        ]
                        //?exported allows for the
                        // file to be inspected.
                    }
                );
            } else {
                webpack.entry[name] = preEntry.concat(webpack.entry[name]);
                this.info(
                    `not using exported components, you may need to setup hot and dom mounting manually for ${name}
                     Something like  to your entry point:
                     
                     ${(hot ? generateHot : generate)(name, 'content', true) }
                    
                    `);


            }
        });
    } else if (this.isLibrary) {
        if (!webpack.externals) {
            webpack.externals = [];
        }
        webpack.externals.push('react', 'react-dom', 'prop-types');
    }
    return webpack;
};