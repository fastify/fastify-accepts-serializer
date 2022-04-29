# @fastify/accepts-serializer

![CI](https://github.com/fastify/fastify-accepts-serializer/workflows/CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/@fastify/accepts-serializer)](https://www.npmjs.com/package/@fastify/accepts-serializer)
[![Known Vulnerabilities](https://snyk.io/test/github/fastify/fastify-accepts-serializer/badge.svg)](https://snyk.io/test/github/fastify/fastify-accepts-serializer)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Serialize according to the `Accept` header. Supports Fastify versions `^3.0.0`

Please refer to [this branch](https://github.com/fastify/fastify-accepts-serializer/tree/v2.x) and related versions for Fastify ^2.0.0 compatibility.
Please refer to [this branch](https://github.com/fastify/fastify-accepts-serializer/tree/1.x) and related versions for Fastify ^1.10.0 compatibility.

## Install
```sh
npm i --save @fastify/accepts-serializer
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
fastify.register(require('@fastify/accepts-serializer'), {
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
  default: 'application/yaml' // MIME type used if Accept header don't match anything
})

// Per-router serializers
const config = {
  serializers: [
    {
      regex: /^application\/x-protobuf$/,
      serializer: body => AwesomeMessage.encode(AwesomeMessage.create(body)).finish()
    }
  ]
}

fastify.get('/request', { config }, function (req, reply) {
  reply.send({pippo: 'pluto'})
})
```

## Behaviour

For each route, a SerilizerManager is defined, which has both per-route and global serializer definitions.

The MIME type `application/json` is always handled by `fastify` if no serializer is registered for that MIME type.

If no `default` key is specified in configuration, all requests with an unknown `Accept` header will be replied to with a 406 response (a boom error is used).
