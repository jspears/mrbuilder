/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/
'use strict';

const escapeHtml       = require('markdown-it/lib/common/utils').escapeHtml;
const _Renderer        = require('markdown-it/lib/renderer');
const reactReplace     = (str) => str.replace(/'/g, "\\'")
    .replace(/\${/g, "${'${'}");
const requireOrDefault = (value) => `{((value)=>(value.default || value))(require(${JSON.stringify(value)}))}`

//Copied to prevent brining in markdown/utils stuff.
const camelCased       = function (str, first) {
    str = str.replace(/[.-]([a-z])/g, g => g[1] && g[1].toUpperCase());
    if (first) {
        return `${str[0].toUpperCase()}${str.substring(1)}`;
    }
    return str;
};
const renderReactAttrs = (at) => JSON.stringify(
    at.reduce((ret, [key, value]) => {
        ret[key] = value;
        return ret;

    }, {})).replace(/^"(.*)$/, '$1');

const reactStyle = (value) => {
    return `{${JSON.stringify(
        value.split(/;/g).reduce(function (ret, key) {

            const parts = key.split(':', 2);

            ret[camelCased(parts[0])] = parts[1];

            return ret;
        }, {})).replace(/^"(.*)"$/, '$1')}}`;
};

class Renderer extends _Renderer {
    constructor(...args) {
        super(...args);

        this.prelude              = {};
        this.imports              = {
            '* as React': 'react'
        };
        this.renderImport         = this._renderImport.bind(this);
        this.renderPrelude        = this._renderPrelude.bind(this);
        this.rules['text']        = this.text;
        this.rules['html_inline'] = this.inlineHtml.bind(this);
        this.rules['html_block']  = this.blockHtml.bind(this);
    }

    blockHtml(tokens, idx) {
        const current = tokens[idx];
        return current.content;
    }

    inlineHtml(tokens, idx, options) {
        const content  = tokens[idx].content;
        const tagParts = /^<(.*)\s+?(.*)\/?>$/.exec(content);
        if (tagParts == null) {
            return content;
        }
        const tag      = tagParts[1];
        const attrs    = (tagParts[2] || '').replace(
            /((\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?)/g,
            (m, i2, k, v) => {
                if (k === 'style') {
                    return `style=${reactStyle(v)}`;
                }
                return m;
            });
        const override = options.overrides && options.overrides[tag];
        if (override) {
            if (override.props) {
                attrs.push(...Object.keys(override.props)
                    .map(v => [v, override.props[v]]));
            }
            return `<${options.component || tag} \{...${renderReactAttrs(
                attrs)}\}>`
        }
        return `<${tag} ${attrs}>`;
    };

    text(tokens, idx /*, options, env */) {
        return `{'${escapeHtml(reactReplace(tokens[idx].content))}'}`;
    }


    /**
     * Renderer.renderAttrs(token) -> String
     *
     * Render token attributes to string.
     **/
    renderAttrs(token) {
        let i, l, result;

        if (!token.attrs) {
            return '';
        }

        result      = '';
        const attrs = [];
        for (i = 0, l = token.attrs.length; i < l; i++) {
            let [name, value] = token.attrs[i];
            switch (name) {
                case 'class':
                    name  = 'className';
                    value = `"${escapeHtml(value)}"`;
                    break;
                case 'for':
                    name  = 'htmlFor';
                    value = `"${escapeHtml(value)}"`;
                    break;
                case 'style':
                    value = reactStyle(value);
                    break;
                case 'type':
                    if (value === 'checkbox') {
                        value = `"${escapeHtml(value)}"`;
                        attrs.push(['readOnly', `{true}`]);
                    }
                    break;
                case 'checked':
                    if (token.type === 'checkbox_input') {
                        attrs.push(['checked', `{${value}}`]);
                        continue;
                    }
                    break;
                case 'src':
                    if (token.tag == 'img' && !/^\/\/|^https?:\/\//.test(
                        value)) {
                        value = requireOrDefault(value);
                        break;
                    }
                default:
                    value = `"${escapeHtml(value)}"`;
                    break;
            }
            attrs.push([name, value]);
        }


        for (i = 0, l = attrs.length; i < l; i++) {
            const [name, value] = attrs[i];
            result +=
                ' ' + escapeHtml(name) + (value != null ? '=' + value : '');
        }

        return result;
    }


    render(tokens, options, env) {
        let i, len, type,
            result = ``,
            rules  = this.rules;

        for (i = 0, len = tokens.length; i < len; i++) {
            type = tokens[i].type;

            if (type === 'inline') {
                result += this.renderInline(tokens[i].children, options, env);
            } else if (typeof rules[type] !== 'undefined') {
                result += rules[tokens[i].type](tokens, i, options, env, this);
            } else {
                result += this.renderToken(tokens, i, options, env);
            }
        }

        return `
${Object.keys(this.imports).map(this.renderImport, this.imports).join(';\n')}
${Object.keys(this.prelude).map(this.renderPrelude, this.prelude).join('')}
//autogenerated class
export default function MrBuilderMarkdown(props){
   return (<div {...props}>${result}</div>);
}
`;
    }


    _renderPrelude(key) {
        const value = this.prelude[key];
        if (!value) {
            return '';
        }
        return key;
    }

    _renderImport(key) {
        return `import ${key} from '${this.imports[key]}'`;
    }
}

module.exports = Renderer;
