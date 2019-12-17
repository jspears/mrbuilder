module.exports = (plop) => {
    plop.setGenerator('monorepo', {
        description: 'Generates a mrbuilder monorepo',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Monorepo name: '
        }, {
            type: 'input',
            name: 'namespace',
            message: 'Namespace (@yourcompany) or empty for no namespace: '
        }, {
            type: 'input',
            name: 'description',
            message: 'Plugin description: '
        }, {
            input: 'input',
            name: 'gitRemote',
            message: 'Use different remote like upstream, default is no remote?'
        }],
        actions: [
            {
                type: 'add',
                path: '{{project}}/lerna.json',
                templateFile: `./monorepo/lerna.json`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/package.json',
                templateFile: `./monorepo/package.json`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/builder/package.json',
                templateFile: `./monorepo/builder/package.json`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/Readme.md',
                templateFile: `./monorepo/builder/Readme.md`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/bin/builder.js',
                templateFile: `./monorepo/builder/bin/builder.js`,
                abortOnFail: true,
                force: false,
                data: {},
            },
        ];

}
)
    ;

}