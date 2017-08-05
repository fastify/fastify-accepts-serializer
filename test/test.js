'use strict'
/* eslint-env node, mocha */

const assert = require('assert')

const plugin = require('../')

const Fastify = require('fastify')

const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

describe('serializer', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin, {
      serializers: [
        {
          regex: /^application\/yaml$/,
          serializer: body => YAML.stringify(body)
        },
        {
          regex: /^application\/x-protobuf$/,
          serializer: body => AwesomeMessage.encode(AwesomeMessage.create(body)).finish()
        },
        {
          regex: /^application\/x-msgpack$/,
          serializer: body => msgpack.encode(body)
        }
      ]
    })

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })

    fastify.get('/request2', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('application/yaml -> yaml', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/yaml')
      assert.deepEqual(response.payload, YAML.stringify({pippo: 'pluto'}))

      done()
    })
  })

  it('application/x-protobuf -> protobuf', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/x-protobuf')
      assert.deepEqual(response.payload, AwesomeMessage.encode(AwesomeMessage.create({pippo: 'pluto'})).finish().toString())

      done()
    })
  })

  it('application/x-protobuf -> protobuf', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/x-protobuf')
      assert.deepEqual(response.payload, AwesomeMessage.encode(AwesomeMessage.create({pippo: 'pluto'})).finish().toString())

      done()
    })
  })

  it('application/x-msgpack -> msgpack', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/x-msgpack')
      assert.deepEqual(response.payload, msgpack.encode({pippo: 'pluto'}).toString())

      done()
    })
  })
})

describe('serializer - default = undefined', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin, {
      serializers: [
        {
          regex: /^application\/yaml$/,
          serializer: body => YAML.stringify(body)
        }
      ]
    })

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('no match -> 406', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/json')
      assert.deepEqual(response.statusCode, 406)
      assert.deepEqual(response.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: /^application\\/yaml$/,application/json'
      }))

      done()
    })
  })
})

describe('serializer - default = application/json by fastify', () => {
  let fastify

  before('load fastify', () => {
    fastify = Fastify()

    fastify.register(plugin, {
      serializers: [ ],
      default: 'application/json'
    })

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('no match -> json', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/json')
      assert.deepEqual(response.payload, JSON.stringify({pippo: 'pluto'}))

      done()
    })
  })
})

describe('serializer - default = application/json by custom', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin, {
      serializers: [
        {
          regex: /^application\/json$/,
          serializer: body => 'my-custom-string'
        }
      ],
      default: 'application/json'
    })

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('no match -> json', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/json')
      assert.deepEqual(response.payload, 'my-custom-string')

      done()
    })
  })
})

describe('serializer - default = application/yaml', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin, {
      serializers: [
        {
          regex: /^application\/yaml$/,
          serializer: body => YAML.stringify(body)
        }
      ],
      default: 'application/yaml'
    })

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('no match -> yaml', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/yaml')
      assert.deepEqual(response.payload, YAML.stringify({pippo: 'pluto'}))

      done()
    })
  })
})

describe('serializer per route', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin, {
      serializers: [
        {
          regex: /^application\/yaml$/,
          serializer: body => YAML.stringify(body)
        }
      ],
      default: 'application/yaml'
    })

    const config = {
      serializer: {
        serializers: [
          {
            regex: /^application\/yaml$/,
            serializer: body => 'my-custom-string'
          },
          {
            regex: /^application\/x-msgpack$/,
            serializer: body => 'my-custom-string-msgpack'
          }
        ]
      }
    }

    fastify.get('/request', { config }, function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('overwrite', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/yaml')
      assert.deepEqual(response.payload, 'my-custom-string')

      done()
    })
  })

  it('not defined globally', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/x-msgpack')
      assert.deepEqual(response.payload, 'my-custom-string-msgpack')

      done()
    })
  })
})

describe('serializer without conf', () => {
  let fastify
  before('load fastify', () => {
    fastify = Fastify()
    fastify.register(plugin)

    fastify.get('/request', function (req, reply) {
      reply.send({pippo: 'pluto'})
    })
  })

  it('application/json -> json', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/json'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/json')
      assert.deepEqual(response.payload, JSON.stringify({pippo: 'pluto'}))

      done()
    })
  })

  it('application/yaml -> 406', done => {
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, response => {
      assert.deepEqual(response.headers['content-type'], 'application/json')
      assert.deepEqual(response.statusCode, 406)
      assert.deepEqual(response.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: application/json'
      }))

      done()
    })
  })
})
