



module.exports = (plop)=>{
    plop.setGenerator('plugin', {
        description: 'Generates a mrbuilder plugin',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Plugin name: '
        }, {
            type: 'input',
            name: 'description',
            message: 'Plugin description: '
        }],
        actions:[
            {
                type: 'add',
                path: '{{project}}/package.json',
                templateFile: `./plugin/package.json`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/Readme.md',
                templateFile: `./plugin/Readme.md`,
                abortOnFail: true,
                force: false,
                data: {},
            },
            {
                type: 'add',
                path: '{{project}}/bin/cli.js',
                templateFile: `./plugin/bin/cli.js`,
                abortOnFail: true,
                force: false,
                data: {},
            },
        ]  // array of actions
    });

}