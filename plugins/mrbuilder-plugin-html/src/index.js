const HtmlWebpackPlugin  = require('html-webpack-plugin');
const path               = require('path');
const babelConfig        = require('mrbuilder-plugin-babel/babel-config');
const { parseEntry }     = require('mrbuilder-utils');
/**
 *   title     : (deps.description ? deps.description : deps.name),
 hash      : opts.useNameHash,
 filename  : 'index.html',
 publicPath: opts.publicPath,
 analytics : opts.analytics
 * @param pages
 * @param config
 * @param webpack
 */
const ogenerateAssetTags = HtmlWebpackPlugin.prototype.generateAssetTags;

function charset(ele) {
    if (!ele.attributes) {
        ele.attributes = {};
    }
    if (!ele.attributes.charset) {
        ele.attributes.charset = 'UTF-8';
    }
}

HtmlWebpackPlugin.prototype.generateAssetTags = function (assets) {
    const ret = ogenerateAssetTags.call(this, assets);
    ret.body.forEach(charset);
    ret.head.forEach(charset);
    return ret;
};


module.exports = function ({
                               pages,
                               title,

                               entry,
                               publicPath = path.join(process.cwd(), 'public'),
                               template,
                               filename = '[name].html',
                               analytics,
                           },
                           webpack, om) {
    const info = this.info || console.log;
    const pkg  = require(path.join(process.cwd(), 'package.json'));

    if (!this.useHtml) {
        info('not using html as not in app,demo or development mode');
        return webpack;
    }
    if (!title) {
        title = `${pkg.name}: ${pkg.description || ''}`
    }
    if (!template) {
        template = path.resolve(__dirname, '..', 'public',
            analytics ? 'index_analytics.ejs' : 'index.ejs');
    }

    if (!publicPath) {
        publicPath = path.resolve(__dirname, '..', 'public');
    }

    entry = entry ? parseEntry(entry) : webpack.entry;
    if (!entry) {
        entry = webpack.entry = { index: path.join(publicPath, 'index') };
        try {
            //if we can resolve it
            require.resolve(entry.index);
            info('entry', entry.index);

        } catch (e) {
            entry = webpack.entry = { index: `${__dirname}/app.js` };
            info('using default entry');
            webpack.module.rules.push({
                test: new RegExp(webpack.entry.index),
                use : [{
                    loader : 'babel-loader',
                    options: babelConfig
                }, {
                    loader : 'val-loader',
                    options: pkg
                }]
            });
        }
    }
    const keys = pages ? Object.keys(pages) : Object.keys(entry);

    info('creating pages', keys);
    webpack.plugins.push(...keys.map(name => {
        const chunks = [name];
        //html plugin is kinda borked, so this is a nasty workaround.
        if (om && om.enabled('mrbuilder-plugin-chunk')) {
            const { manifest = 'manifest', vendors = 'vendors' } = om.config(
                'mrbuilder-plugin-chunk');
            if (manifest) {
                chunks.unshift(manifest);
            }
            if (vendors) {
                chunks.unshift(vendors);
            }
            info('using chunks', chunks);
        }
        return new HtmlWebpackPlugin(Object.assign({}, {
            filename: filename.replace(/(\[name\])/g, name) || `${name}.html`,
            chunks,
            name,
            title,
            template,
            publicPath,
        }, pages && pages[name]));
    }));

    return webpack;
};
