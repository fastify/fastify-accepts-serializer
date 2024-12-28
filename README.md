# @fastify/accepts-serializer

[![CI](https://github.com/fastify/fastify-accepts-serializer/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-accepts-serializer/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@fastify/accepts-serializer)](https://www.npmjs.com/package/@fastify/accepts-serializer)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Serialize according to the `Accept` header.


## Install
```sh
npm i @fastify/accepts-serializer
```

### Compatibility

| Plugin version | Fastify version |
| ---------------|-----------------|
| `^6.x`         | `^5.x`          |
| `^5.x`         | `^4.x`          |
| `^3.x`         | `^3.x`          |
| `^2.x`         | `^2.x`          |
| `^1.x`         | `^1.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Usage
```js

const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

const fastify = require('fastify')()

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

## Behavior

For each route, a SerializerManager is defined, which has both per-route and global serializer definitions.

The MIME type `application/json` is always handled by `fastify` if no serializer is registered for that MIME type.

If no `default` key is specified in configuration, all requests with an unknown `Accept` header will be replied to with a 406 response (a boom error is used).

## License

Licensed under [MIT](./LICENSE).
