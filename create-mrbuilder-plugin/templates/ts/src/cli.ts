#!/usr/bin/env node
process.env.MRBUILDER_INTERNAL_PLUGINS="${process.env.MRBUILDER_INTERNAL_PLUGINS},@{namespace}/plugin-{{name}}";
require('../lib/cli.js');