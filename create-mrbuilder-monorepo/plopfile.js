module.exports = function (plop) {
    // create your generators here
    plop.setGenerator('monorepo', {
        description: 'This is sets up a mrbuilder monorepo',
        prompts: [{
            type: 'input',
            name: 'namespace',
            message: 'what namespace do you want to use?'
        }, {
            type: 'input',
            name: 'packages',
            message: 'what directory would you like to put your packages?',
            default: 'packages'
        }, {
            type: 'input',
            name: 'version',
            message: 'what version would you like to start?',
            default: '0.0.1'
        }, {
            type: 'input',
            name: 'upstream',
            message: 'what do you call your git origin for push?',
            default: 'origin'
        }, {
            type:'input',
            name:'npmClient',
            message: 'which npm client would you like Lerna to use?',
            default:'yarn'
        }], // array of inquirer prompts
        actions: [
            {
                type: 'addMany',
                templateFiles: './templates/*',
                base: './templates',
                destination: '{{namespace}}'
            },
            {
                type: 'addMany',
                templateFiles: './templates/.*',
                base: './templates',
                destination: '{{namespace}}'
            },
            {
                type: 'addMany',
                templateFiles: './templates/packages/**/*',
                base: './templates/packages',
                destination: '{{namespace}}/{{packages}}'
            }
        ]  // array of actions
    });
};