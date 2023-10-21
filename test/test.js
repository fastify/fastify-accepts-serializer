'use strict'

const t = require('tap')
const test = t.test

const plugin = require('../')
const Fastify = require('fastify')
const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

test('serializer', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/u,
        serializer: body => YAML.stringify(body)
      },
      {
        regex: /^application\/x-protobuf$/u,
        serializer: body => AwesomeMessage.encode(AwesomeMessage.create(body)).finish()
      },
      {
        regex: /^application\/x-msgpack$/u,
        serializer: body => msgpack.encode(body)
      }
    ]
  })
  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('application/yaml -> yaml', t => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/yaml')
      t.strictSame(res.payload, YAML.stringify({ pippo: 'pluto' }))
    })
  })

  t.test('application/x-protobuf -> protobuf', t => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/x-protobuf')
      t.strictSame(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
    })
  })

  t.test('application/x-protobuf -> protobuf', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/x-protobuf')
      t.strictSame(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
    })
  })

  t.test('application/x-msgpack -> msgpack', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/x-msgpack')
      t.strictSame(res.payload, msgpack.encode({ pippo: 'pluto' }).toString())
    })
  })
})

test('serializer - default = undefined', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/u,
        serializer: body => YAML.stringify(body)
      }
    ]
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('no match -> 406', t => {
    t.plan(4)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictSame(res.statusCode, 406)
      t.strictSame(res.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: /^application\\/yaml$/,application/json'
      }))
    })
  })
})

test('serializer - default = application/json by fastify', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [],
    default: 'application/json'
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('no match -> json', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictSame(res.payload, JSON.stringify({ pippo: 'pluto' }))
    })
  })
})

test('serializer - default = application/json by custom', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/json$/u,
        serializer: () => 'my-custom-string'
      }
    ],
    default: 'application/json'
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('no match -> json', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/json')
      t.strictSame(res.payload, 'my-custom-string')
    })
  })
})

test('serializer - default = application/yaml', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/u,
        serializer: body => YAML.stringify(body)
      }
    ],
    default: 'application/yaml'
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('no match -> yaml', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/yaml')
      t.strictSame(res.payload, YAML.stringify({ pippo: 'pluto' }))
    })
  })
})

test('serializer per route', t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/u,
        serializer: body => YAML.stringify(body)
      }
    ],
    default: 'application/yaml'
  })

  fastify.get('/request', function (req, reply) {
    reply
      .serializer(_ => 'my-custom-string')
      .send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (req, reply) {
    reply
      .type('application/x-msgpack')
      .serializer(_ => 'my-custom-string-msgpack')
      .send({ pippo: 'pluto' })
  })

  t.test('overwrite', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/yaml')
      t.strictSame(res.payload, 'my-custom-string')
    })
  })

  t.test('not defined globally', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/x-msgpack')
      t.strictSame(res.payload, 'my-custom-string-msgpack')
    })
  })
})

test('serializer per route through route option', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/u,
        serializer: body => YAML.stringify(body)
      }
    ],
    default: 'application/yaml'
  })

  const config = {
    serializers: [
      {
        regex: /^application\/x-protobuf$/u,
        serializer: body => AwesomeMessage.encode(AwesomeMessage.create(body)).finish()
      }
    ]
  }

  fastify.get('/request', { config }, function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (req, reply) {
    reply.send('my-custom-string')
  })

  fastify.get('/request3', function (req, reply) {
    reply
      .serializer(_ => 'foo-bar-baz')
      .send({ pippo: 'pluto' })
  })

  t.test('application/x-protobuf -> protobuf', t => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/x-protobuf')
      t.strictSame(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
    })
  })

  t.test('route level should not pullute global cache', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/yaml')
      t.strictSame(res.payload, 'my-custom-string')
    })
  })

  t.test('overwrite by fastify reply', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request3',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/yaml')
      t.strictSame(res.payload, 'foo-bar-baz')
    })
  })
})

test('serializer without conf', t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(plugin)

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  t.test('application/json -> json', t => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/json'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictSame(res.payload, JSON.stringify({ pippo: 'pluto' }))
    })
  })

  t.test('application/yaml -> 406', t => {
    t.plan(4)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictSame(res.statusCode, 406)
      t.strictSame(res.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: application/json'
      }))
    })
  })
})

test('serializer cache', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/cache$/u,
        serializer: (body) => body
      }
    ]
  })

  t.test('it shoud populate cache', t => {
    t.plan(8)

    fastify.get('/request', function (req, reply) {
      t.strictSame(Object.keys(reply.serializer.cache), ['application/cache'])

      reply.send('cache')
    })

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/cache')
      t.strictSame(res.payload, 'cache')
    })

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    }, (err, res) => {
      t.error(err)
      t.strictSame(res.headers['content-type'], 'application/cache')
      t.strictSame(res.payload, 'cache')
    })
  })
})
