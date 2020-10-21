#!/usr/bin/env node
import set from 'lodash/set';
import unset from 'lodash/unset';
import has from 'lodash/has';
import get from 'lodash/get';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import {lernaFilteredPackages, splitRest} from '@mrbuilder/utils';

export const settings = {
    exit: process.exit,
    error: console.error,
    warn: console.warn,
    log: console.log,
    trace: console.trace,
};
type CommandFn = (json: any, args: KeyValue, filename: string, options: Option) => Promise<boolean>;

const write = (filename: string, json: any) => new Promise(
    (resolve, reject) => fs.writeFile(filename, JSON.stringify(json, null, 2),
        'utf8', (e: any, o?: any) => e ? reject(e) : resolve(o)));

const read = (filename: string): {} => new Promise(
    (resolve, reject) => fs.readFile(filename, 'utf8',
        (e, o) => e ? reject(e) : resolve(JSON.parse(o))));

function parse(value: string): any {
    value = value.trim();
    if (value === 'true' || value === 'false') {
        return JSON.parse(value);
    }
    if (value === 'null') {
        return null;
    }
    if (value === '') {
        return value;
    }
    if ((value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']')) ||
        (value.startsWith('"') && value.endsWith('"')) ||
        /^((?:NaN|-?(?:(?:\d+|\d*\.\d+)(?:[E|e][+|-]?\d+)?|Infinity)))$/.test(
            value)) {
        return JSON.parse(value);
    }
    return JSON.parse(`"${value}"`)
}

type ConfirmOpts = {
    confirm?: boolean
}

async function confirm(message: string, {confirm = false}: ConfirmOpts): Promise<boolean> {
    if (confirm) {
        const answer = await inquirer.prompt([{message, type: 'confirm', name: 'confirm'}]);
        return answer.confirm;
    }
    return true;
}


type Option = ConfirmOpts & {
    ignore?: boolean,
    noLerna?: boolean,
    preview?: boolean,
    skipIfExists?: boolean,
    onlyIfExists?: boolean,
    createIfNotExists?: boolean,

}
type KeyValue = [string, string];

const _set: CommandFn = async function (json: {}, [key, value]: KeyValue, filename: string, options?: Option) {
    const current = get(json, key);
    if (current === value) {
        return false;
    }
    const hasKey = has(json, key);
    if (hasKey) {
        if (options.skipIfExists) {
            return false;
        }
    } else {
        if (options.onlyIfExists) {
            return false
        }
    }

    if (await confirm(
        `Are you sure you want to change ${key} in '${this.name}/${filename}?' ${hasKey
            ? `[${JSON.stringify(current, null, 2)}]` : ''}`, options)) {
        set(json, key, value);
        return true;
    }
    return false;
}

function __get(key: string) {
    return JSON.stringify(get(this, key));
}

async function _move(json: {}, keys: KeyValue, filename: string, opts: ConfirmOpts) {
    const [from, to] = keys;
    if (!from || !to) {
        settings.warn(`move requires an argument`, from, to);
    }
    if (has(json, from)) {
        if (!await confirm(
            `Are you sure you want to move '${from}' to '${to}' in '${filename}?'`,
            opts)) {
            return false;
        }
        const f = get(json, from);
        unset(json, from);
        //Merge objects if there is a destination
        if (typeof f === 'object' && get(json, to)) {
            for (const key of Object.keys(f)) {
                set(json, `${to}.${key}`, f[key]);
            }
        } else {
            set(json, to, f);
        }
        return true;
    }
    return false;
}

const _get: CommandFn = async function (json: any, keys: KeyValue, filename: string, opts: Option = {}) {
    const str = keys.map(__get, json).join(',');
    if (str) {
        if (opts.skipIfExists) {
            return false;
        }
    } else {
        if (opts.onlyIfExists) {
            return false;
        }
    }
    settings.log(this.name, '=', str);
    return false;
}

// noinspection JSUnusedLocalSymbols
const _delete: CommandFn = async function (json: any, keys: KeyValue, filename: string, opts?: ConfirmOpts): Promise<boolean> {
    let ret = false;
    for (const key of keys) {
        if (has(json, key)) {
            if (!(await confirm(`Are you sure you want to delete '${key}'`,
                opts))) {
                continue;
            }
        }
        unset(json, key);
        //@ts-ignore
        ret |= true;
    }
    return ret;
}


const _prompt: CommandFn = async function (json: any, args: KeyValue, filename: string, options: Option): Promise<boolean> {
    const [key, vmessage = 'Do you want to change the property'] = args,
        self = this,
        _default = get(json, key),
        message = `${vmessage} '${key}' in '${this.name}/${filename}'?`;

    if (options.skipIfExists && _default != null) {
        return false;
    }
    const hasKey = has(json, key);
    if (hasKey) {
        if (options.skipIfExists) {
            return false;
        }
    } else {
        if (options.onlyIfExists) {
            return false
        }
    }
    if (await confirm(message, {confirm: true})) {
        const answer = await inquirer.prompt([{
            type: 'input',
            name: 'value',
            message: has(json, key) ? `OK what would like to change it to?`
                : vmessage
        }]);
        if (answer.value === _default) {
            return false;
        }
        try {
            set(json, key, parse(answer.value));
            return true;
        } catch (e) {
            settings.warn(`Could not parse the value try again`, e);
        }
        return _prompt.call(self, json, args, filename, options);
    }
}

type Package = {
    name: string,
    location: string,
}

type InternalOption = Option & {
    options?: Option,
    cwd?: string,
    ignore?: boolean,
    scope?: string[],
    filteredPackages?: Package[],
    files?: string[], extension?: string, preview?: boolean, noExtension?: boolean, commands: [CommandFn, any][]
};

export async function muckFile(pkg: Package, file: string, opts: InternalOption) {
    let saveMuck = false;
    const fullname = path.resolve(pkg.location, file);
    let json: any;
    try {
        json = await read(fullname);
    } catch (e) {
        if (opts.createIfNotExists && !fs.existsSync(fullname)) {
            json = {};
        } else {
            settings.warn(`Error reading ${fullname}`, e);
            return false
        }
    }
    for (const cmd of opts.commands) {
        if (await cmd[0].call(pkg, json, cmd[1], file, opts)) {
            saveMuck = true;
        }
    }

    if (saveMuck && json) {
        const backup = fullname + opts.extension;
        let newfile = fullname;
        if (opts.preview) {
            settings.log(JSON.stringify(json, null, 2));
            if (!await confirm(`Does above look correct for ${fullname}`,
                {confirm: true})) {
                return false;
            }
        }
        if (!opts.noExtension) {
            if (fs.existsSync(backup) && !await confirm(
                `a file named ${newfile} already, do want to overwrite?`,
                opts)) {
                return false;
            }
            //rename the current file.
            fs.renameSync(newfile, backup);
        }

        try {
            await write(newfile, json);
        } catch (e) {
            if (backup != newfile && fs.existsSync(backup)) {
                try {
                    fs.renameSync(backup, newfile);
                } catch (ee) {
                    settings.warn(`Error renaming ${backup} back to ${newfile}`,
                        e)

                }
            }
            settings.warn(`Error writing ${newfile}`, e)
        }
    }
    return true;

}

export function makeOptions(name: string, args: string[],): InternalOption | void {
    function help(msg?: string): void {
        if (msg) {
            settings.error(msg);
        }
        settings.warn(`${name}   [-sdgihfe] <files>
      -b\t--backup\t<extension>\tuse a different extension
      -p\t--prompt\tkey=question\tprompt for value before changing
      -c\t--confirm\t\tconfirm before dangerous operations
      -m\t--move\t\tfrom=to\tMove property from=to
      -s\t--set\t\tkey=value sets key to value
      -d\t--delete\tkey\tdeletes values (comma)
      -g\t--get\t\tvalue\tgets the value
      -i\t--ignore\tpackages to ignore
      -h\t--help\t\tthis helpful message
      -f\t--file\t\tpackage.json default
      -k\t--skip\t\tSkip the question if it has value
      -n\t--no-lerna\tJust use the file don't iterate over lerna projects
      -C\t--create-file\tCreate the file if it does not exist
      -P\t--preview\tPreview files if there are changes, before writing.
      -u\t--unless\tDo the action only if it has a value 
      -S\t--scope packages,\t Only apply to these packages (glob).
      --no-extension\tuse in place
    `);
        settings.exit(1);
    }

    const opts: InternalOption = {
        extension: '.bck',
        files: [],
        commands: [],
        options: {},


    };
    const commands = opts.commands;
    const options = opts.options;
    //need this to suck up files at the end.
    let i = 0;
    ARGS: for (let l = args.length; i < l; i++) {
        let [arg, val] = splitRest(args[i], '=');
        switch (arg) {
            //actions
            case '--prompt':
            case '-p':
                const message = (val || args[++i]);
                if (!message) {
                    throw new Error(`message must be defined for "${arg}"`);
                }
                commands.push([_prompt, splitRest(message,'=')]);
                break;
            case '-s':
            case '--set':
                const [key, value] = splitRest(val || args[++i],'=');
                commands.push([_set, [key, parse(value)]]);
                break;
            case '-d':
            case '--delete':
                const keys = (val || args[++i]).split(/,\s*/);
                commands.push([_delete, keys]);
                break;
            case '-g':
            case '--get':
                commands.push([_get, (val || args[++i]).split(/,\s*/)]);
                break;
            case '-m':
            case '--move':
                commands.push([_move, splitRest(val || args[++i], '=')]);
                break;

            //options
            case '-k':
            case '--skip':
            case '--skip-if-exists':
                opts.skipIfExists = true;
                break;
            case '-u':
            case '--unless':
            case '--only-if-exists':
                opts.onlyIfExists = true;
                break;
            case '-c':
            case '--confirm':
                opts.confirm = true;
                break;
            case '-i':
            case '--ignore':
                options.ignore = args[++i] ? true : false;
                break;
            case '-f':
            case '--file':
                opts.files = opts.files.concat((val || args[++i]).split(/,\s*/));
                break;
            case '-C':
            case '--create-file':
                opts.createIfNotExists = true;
                break;
            case '-e':
            case '--extension':
            case '-b':
            case '--backup':
                opts['extension'] = (val || args[++i]).trim();
                if (!opts['extension']) {
                    return help(
                        `--backup requires an extension use --no-backup to rename in place`)
                }
                break;
            case '-X':
            case '--no-extension':
            case '--no-backup':
                opts.noExtension = true;
                break;
            case '-n':
            case '--no-lerna':
                opts.noLerna = true;
                break;
            case '--preview':
            case '-P':
                opts.preview = true;
                break;
            case '--scope':
            case '-S':
                opts.scope = opts.files.concat((val || args[++i]).split(/,\s*/));
                break;
            case '-h':
            case '--help':
                return help();
            default: {
                break ARGS;
            }

        }
    }
    if (commands.length === 0) {
        help(`need a command ${args}`);
    }
    opts.files = opts.files.concat(args.slice(i));
    if (opts.files.length === 0) {
        opts.files.push('package.json');
    }
    return opts;
}


export async function muck(opts: InternalOption | void) {
    if (!opts) {
        return;
    }
    if (!opts.noLerna) {

        const options: InternalOption = {commands: []};
        if (opts.cwd) {
            options.cwd = opts.cwd;
        }
        if (opts.scope) {
            options.scope = opts.scope;
        }
        const filteredPackages = await lernaFilteredPackages(opts);


        opts.filteredPackages = filteredPackages;
        for (const pkg of filteredPackages) {
            for (const file of opts.files) {
                await muckFile(pkg, file, opts);
            }
        }
    } else {
        for (const file of opts.files) {

            await muckFile({name: '.', location: process.cwd()}, file, opts);
        }
    }
}

if (require.main === module) {
    muck(makeOptions(process.argv[1], process.argv.slice(2))).then(() => {
        settings.exit(0);
    }, (e) => {
        settings.trace(e);
        process.exit(1);
    });
}
