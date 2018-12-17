const {cwd}    = require('mrbuilder-utils');
const useBabel = require('../use-babel');
const version  = require('../version');
module.exports = ({
                      test,
                      include = [
                          cwd('src'),
                          cwd('public'),
                          /\/src\//,
                          /\/public\//,
                          /mrbuilder-plugin-html\/.*/
                      ],
                  }, webpack, om) => {

    const use = useBabel(om);


    if (!test) {
        test = /\.[je]sx?$/;
        if (om.config('mrbuilder-plugin-typescript.useBabel')) {
            if (version > 6){
                test = /\.[jet]sx?$/
            }else{
                (this.warn || console.warn)('useBabel only works with babel 7 or higher')
            }
        }
    }

    webpack.module.rules.push({
        test,
        include,
        use,
    });
    return webpack;
};
