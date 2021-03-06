const getConfig = require('react-styleguidist/lib/scripts/config').default;
const StyleguidistOptionsPlugin = require('react-styleguidist/lib/scripts/utils/StyleguidistOptionsPlugin').default;
const RENDERER_REGEXP = /Renderer$/;
const {
    join,
    resolve,
    relative
} = require('path');
const {
    cwd,
    enhancedResolve,
    lernaFilteredPackages
} = require('@mrbuilder/utils');

const normalizeLerna = (pkg) => {
    if (pkg && pkg.toJSON) {
        const ret = pkg.toJSON();
        ret._location = pkg.location;
        return ret;
    }
    if (pkg.location) {
        pkg._location = pkg.location;
    }
    return pkg;
};
const handleLerna = opts => lernaFilteredPackages(opts).then(v => v.map(normalizeLerna));

module.exports = function (options = {}, webpack, om) {

    let description = options.description;
    if (!description) {
        description = (v) => v && v.description;
    } else {

        delete options.description
    }
    const resolvePkgDir = (v, ...args) => {
        if (v === om.topPackage.name || v === '.') {
            return resolve('.', ...args);
        }
        return join(om.require.resolve(join(v, 'package.json')), '..', ...args);
    };

    const confFromPackage = (_pkg, component) => {
        const obj = Object.assign({
                name: _pkg.name,
                description: description(_pkg),
                content: join(_pkg._location, 'Readme.md'),
                sections: [],
            },
            typeof component[1] === 'string' ? {
                components: [component[1]]
            } : Array.isArray(component[1]) ? {
                components: component[1]
            } : component[1] != null ? component[1] : {});


        const makeComponent = (name = '**/*.{js,jsx,ts,tsx}') => {


            const key = join(relative(cwd(), join(_pkg._location, om.config('@mrbuilder/cli.sourceDir', 'src'))), name);

            return {components: `${key}.{js,jsx,ts,tsx}`};
        };

        if (!obj.components) {
            obj.sections.push(makeComponent());
        } else if (Array.isArray(obj.components)) {
            obj.sections.push(...obj.components.map(makeComponent));
            delete obj.components;
        } else if (obj.components) {
            obj.sections.push(makeComponent(obj.components));
            delete obj.components;
        }

        return obj;
    };

    const componentsToSections = (opts) => {
        if (!opts) {
            return Promise.resolve(opts);
        }


        const components = opts.components;
        const lerna = opts.lerna;
        delete opts.components;
        delete opts.lerna;

        return (lerna ? handleLerna(lerna).then(comps => comps.map(confFromPackage))
            : Promise.all((components || []).map(function (component) {
                component = Array.isArray(component) ? component : [component];

                /**
                 * ['pkg']
                 * ['pkg', 'MyComponent'],
                 * ['pkg', ['A', 'B'],
                 * ['pkg', {
                 *    components:['A','B']
                 * }]
                 *
                 *
                 */
                const _pkgDir = resolvePkgDir(component[0]);
                const pDir = resolve(_pkgDir, 'package.json');
                const _pkg = require(pDir);
                _pkg._location = _pkgDir;

                return confFromPackage(_pkg, component);

            }))).then(sections => {
            if (opts.sections) {
                return Promise.all(opts.sections.map(componentsToSections)).then(s => {
                    opts.sections = s;
                    return opts;
                });
            } else {
                opts.sections = []
            }
            if (opts.require) {
                opts.require = opts.require.map((v) => enhancedResolve(v));
            }
            if (!opts.sections) {
                opts.sections = sections;
            } else {
                opts.sections = opts.sections.concat(sections);
            }
            return opts;
        });
    };

    const setup = (_newOpts) => {
        if (_newOpts !== options) {
            Object.assign(options, _newOpts);
        }
        if (options.styleguideComponents) {
            Object.entries(options.styleguideComponents).forEach(([name, filepath]) => {
                const fullName = name.match(RENDERER_REGEXP) ? `${name.replace(RENDERER_REGEXP, '')}/${name}` : name;
                webpack.resolve.alias[`rsg-components/${fullName}`] = enhancedResolve(filepath);
            });
        }


        const conf = getConfig(options);


        if (!options.getComponentPathLine) {
            conf.getComponentPathLine = (componentPath) => {

                const [all, name, comp] = /.*\/(.+?)\/src\/(?:.*\/)?(.+?)\.(js|ts|tsx|jsx)$/i.exec(componentPath) || [];
                let ret = componentPath;
                if (comp && name) {
                    ret = `import {${comp}} from '${name}'`;
                }
                return ret;
            };
        }
        webpack.plugins.unshift(new StyleguidistOptionsPlugin(conf));
        (webpack.performance || (webpack.performance = {})).hints = false;
        return webpack;
    };

    if (options.sections == null && options.components == null) {
        return componentsToSections(options).then(setup);
    } else {

        return componentsToSections({
            ...options,
            components: [om.topPackage.name]
        }).then(setup);
    }
};
