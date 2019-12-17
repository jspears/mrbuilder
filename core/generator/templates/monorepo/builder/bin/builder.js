#!/usr/bin/env node
process.env.MRBUILDER_PLUGINS='{{builderPackage}}';
require('@mrbuilder/cli');