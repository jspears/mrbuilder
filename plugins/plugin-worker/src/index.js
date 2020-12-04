const { info } = require('@mrbuilder/cli');
module.exports      = ({
                           test = /\.worker\.jsx?$/,
                           loader = 'worker-loader',
                           filename = "[name].[hash].js",
                           publicPath = '/',
                           inline = true,
                           fallback = false,
                       }, webpack, om) => {
    let name = filename;
    if (info.isLibrary) {
        if (!om.config('@mrbuilder/plugin-worker.filename')) {
            name = '[name].js';
        }
    }
    webpack.module.rules.push({
        test,
        use: {
            loader,
            options: {
                name,
                inline,
                fallback
            }
        }
    });
    //see https://github.com/webpack/webpack/issues/6642
    webpack.output.globalObject = "this";
    return webpack;
};
