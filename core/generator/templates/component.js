const {exec} = require('child_process');

const camelCased = function (str, first = true) {
    str = str.replace(/[.-]([a-z])/g, function (g) {
        return g[1] && g[1].toUpperCase();
    });
    if (first) {
        return `${str[0].toUpperCase()}${str.substring(1)}`;
    }
    return str;
};

const componentDir = `${__dirname}/component`;


const actions = [{
    type: 'add',
    path: '{{project}}/src/{{Component}}.tsx',
    templateFile: `${componentDir}/src/Component.tsx`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/src/{{Component}}.cssm',
    templateFile: `${componentDir}/src/Component.cssm`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/src/index.ts',
    templateFile: `${componentDir}/src/index.ts`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/src/{{Component}}.stories.tsx',
    templateFile: `${componentDir}/src/Component.stories.tsx`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/src/__tests__/{{Component}}.test.tsx',
    templateFile: `${componentDir}/src/__tests__/Component.test.tsx`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/Readme.md',
    templateFile: `${componentDir}/Readme.md`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'add',
    path: '{{project}}/package.json',
    templateFile: `${componentDir}/package.json`,
    abortOnFail: true,
    force: false,
    data: {},
}, {
    type: 'install'
}];

const scoped = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || context.data.root.name || '';
    return arg.toLowerCase();
};

const project = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || context.data.root.name || '';
    return `components/${arg}`
};
const versionOf = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || scoped(context, arg);
    if (arg === '@paypalcorp/merchant-components') {
        arg = '..';
    }

    return require(`${arg}/package.json`).version;
};

const unscoped = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || context.data.root.name;
    return arg.replace(/^(?:@paypalcorp\/)?merchant-/, '').toLowerCase();
};
const toComponent = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || context.data.root.name;

    return camelCased(arg.replace(/(@paypalcorp\/)?merchant-/, ''), true);
};
const dependency = (arg) => `"${arg}" : "^${versionOf(arg)}"`;

const envValue = (context, text) => typeof text === 'string' ? process.env[text] || '' : '';
const packageFn = (context, arg) => {
    if (typeof context === 'string') {
        arg = context;
    }
    arg = arg || context.data.root.name || '';
    return '@paypalcorp/merchant-' + (arg.replace(/^(?:@paypalcorp\/)?merchant-/, '').toLowerCase());
};

const install = (answers, config, plop) => {
    const installer = process.env.npm_execpath || 'yarn';
    return new Promise((res, rej) => {
        exec(`${installer} install`, (err, stdout, stderr) => {
            if (err) {
                console.warn(stderr);
                rej(err);
            }
            res(`complete! try
    #  cd ./${project(answers.name)};
    #  npm run storybook:start
                    `)
        });
    })
};

module.exports = function (plop, a) {

    plop.setHelper('versionOf', versionOf);
    plop.setHelper('Component', toComponent);
    plop.setHelper('scoped', scoped);
    plop.setHelper('project', project);
    plop.setHelper('unscoped', unscoped);
    plop.setHelper('env', envValue);
    plop.setHelper('dependency', dependency);
    plop.setHelper('package', packageFn);
    plop.setActionType('install', install);

    plop.setGenerator('component', {
        description: 'this is a skeleton component',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Package name: '
        }, {
            type: 'input',
            name: 'description',
            message: 'Package description: '
        }],
        actions  // array of actions
    });
};
