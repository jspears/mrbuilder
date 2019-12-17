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

const om = require('@mrbuilder/cli').default;
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

module.exports = function () {
    let {componentPattern, description, ...options} = om.config('@mrbuilder/plugin-react-styleguidist');

    if (!description) {
        description = (v) => v && v.description;
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


        const makeComponent = (name = componentPattern || '**/*.{js,jsx,ts,tsx}') => {

            const source = om.config('@mrbuilder/cli.sourceDir', 'src');
            const components = join(_pkg._location, source, name);

            return {components};
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
                /*          if (component[0].lerna) {
                              return handleLerna(component[0].lerna);
                          }
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
            options.styleguideComponents = Object.keys(options.styleguideComponents).reduce((ret, key) => {
                ret[key] = enhancedResolve(options.styleguideComponents[key]);
                return ret;
            }, {});
        }
        if (options.styleguideComponents) {
            const {styleguideComponents} = options;
            options.styleguideComponents = Object.keys(styleguideComponents)
                .reduce((ret, key) => {
                    ret[key] = enhancedResolve(styleguideComponents[key]);
                    return ret;
                }, {})
        }


        if (!options.getComponentPathLine) {
            options.getComponentPathLine = function (componentPath) {

                const [all, name = om.topPackage.name, comp] = /.*(?:\/(.+?)\/)?src\/(?:.*\/)?(.+?)\.(js|ts|tsx|jsx)$/i.exec(componentPath) || [];
                let ret = componentPath;
                if (comp && name) {
                    ret = `import {${comp}} from '${name}'`;
                }
                return ret;
            };
        }
        return options;
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
