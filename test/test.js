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
      t.strictDeepEqual(res.headers['content-type'], 'application/yaml')
      t.strictDeepEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
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
      t.strictDeepEqual(res.headers['content-type'], 'application/x-protobuf')
      t.strictDeepEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
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
      t.strictDeepEqual(res.headers['content-type'], 'application/x-protobuf')
      t.strictDeepEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
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
      t.strictDeepEqual(res.headers['content-type'], 'application/x-msgpack')
      t.strictDeepEqual(res.payload, msgpack.encode({ pippo: 'pluto' }).toString())
    })
  })
})

test('serializer - default = undefined', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/,
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
      t.strictDeepEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictDeepEqual(res.statusCode, 406)
      t.strictDeepEqual(res.payload, JSON.stringify({
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
      t.strictDeepEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictDeepEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
    })
  })
})

test('serializer - default = application/json by custom', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/json$/,
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
      t.strictDeepEqual(res.headers['content-type'], 'application/json')
      t.strictDeepEqual(res.payload, 'my-custom-string')
    })
  })
})

test('serializer - default = application/yaml', t => {
  t.plan(1)

  const fastify = Fastify()
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
      t.strictDeepEqual(res.headers['content-type'], 'application/yaml')
      t.strictDeepEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
    })
  })
})

test('serializer per route', t => {
  t.plan(2)

  const fastify = Fastify()

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
      t.strictDeepEqual(res.headers['content-type'], 'application/yaml')
      t.strictDeepEqual(res.payload, 'my-custom-string')
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
      t.strictDeepEqual(res.headers['content-type'], 'application/x-msgpack')
      t.strictDeepEqual(res.payload, 'my-custom-string-msgpack')
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
      t.strictDeepEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictDeepEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
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
      t.strictDeepEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.strictDeepEqual(res.statusCode, 406)
      t.strictDeepEqual(res.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: application/json'
      }))
    })
  })
})
