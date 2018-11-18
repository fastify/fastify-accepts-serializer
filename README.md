# fastify-accepts-serializer
[![Build Status](https://travis-ci.org/fastify/fastify-accepts-serializer.svg?branch=master)](https://travis-ci.org/fastify/fastify-accepts-serializer)
[![Coverage Status](https://coveralls.io/repos/github/fastify/fastify-accepts-serializer/badge.svg?branch=master)](https://coveralls.io/github/fastify/fastify-accepts-serializer?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Serializer according to the `Accept` header. Supports Fastify versions < 2.0.0

## Install
```sh
npm i --save fastify-accepts-serializer
```

## Usage
```js

const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

let fastify = require('fastify')()

// Global serializers
fastify.register(require('fastify-accepts-serializer'), {
  serializers: [
    {
      regex: /^application\/yaml$/,
      serializer: body => YAML.stringify(body)
    },
    {
      regex: /^application\/x-msgpack$/,
      serializer: body => msgpack.encode(body)
    }
  ],
  default: 'application/yaml' // mime type used if Accept header don't match anything
})

// Per-router serializers
const config = {
  serializer: {
    serializers: [
      {
        regex: /^application\/x-protobuf$/,
        serializer: body => AwesomeMessage.encode(AwesomeMessage.create(body)).finish()
      }
    ]
  }
}

fastify.get('/request', { config }, function (req, reply) {
  reply.send({pippo: 'pluto'})
})
```

## Behaviour

For each route, it's defined a SerilizerManager that has a merge of per-route and global serializers definition.

The mime type `application/json` is always handled by `fastify` if no serializer is register for that mime type.

If no `default` key is specified in configuration, all requests with unknown `Accept` header will be replied with an 406 response (a boom error is used)
