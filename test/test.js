'use strict'

const { test } = require('node:test')
const plugin = require('../')
const Fastify = require('fastify')
const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

test('serializer', async t => {
  t.plan(4)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(plugin, {
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

  await t.test('application/yaml -> yaml', (t, done) => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/yaml')
      t.assert.strictEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
      done()
    })
  })

  await t.test('application/x-protobuf -> protobuf', (t, done) => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/x-protobuf')
      t.assert.strictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
      done()
    })
  })

  await t.test('application/x-protobuf -> protobuf', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/x-protobuf')
      t.assert.strictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
      done()
    })
  })

  await t.test('application/x-msgpack -> msgpack', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/x-msgpack')
      t.assert.strictEqual(res.payload, msgpack.encode({ pippo: 'pluto' }).toString())
      done()
    })
  })
})

test('serializer - default = undefined', async t => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

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

  await t.test('no match -> 406', (t, done) => {
    t.plan(4)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.assert.strictEqual(res.statusCode, 406)
      t.assert.strictEqual(res.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: /^application\\/yaml$/,application/json'
      }))
      done()
    })
  })
})

test('serializer - default = application/json by fastify', async t => {
  t.plan(1)
  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(plugin, {
    serializers: [],
    default: 'application/json'
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> json', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.assert.strictEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
      done()
    })
  })
})

test('serializer - default = application/json by custom', async t => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())
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

  await t.test('no match -> json', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/json')
      t.assert.strictEqual(res.payload, 'my-custom-string')
      done()
    })
  })
})

test('serializer - default = application/yaml', async t => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())
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

  await t.test('no match -> yaml', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/yaml')
      t.assert.strictEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
      done()
    })
  })
})

test('serializer per route', async t => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(plugin, {
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

  await t.test('overwrite', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/yaml')
      t.assert.strictEqual(res.payload, 'my-custom-string')
      done()
    })
  })

  await t.test('not defined globally', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/x-msgpack')
      t.assert.strictEqual(res.payload, 'my-custom-string-msgpack')
      done()
    })
  })
})

test('serializer per route through route option', async t => {
  t.plan(3)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/yaml$/,
        serializer: body => YAML.stringify(body)
      }
    ],
    default: 'application/yaml'
  })

  const config = {
    serializers: [
      {
        regex: /^application\/x-protobuf$/,
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

  await t.test('application/x-protobuf -> protobuf', (t, done) => {
    t.plan(3)
    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/x-protobuf')
      t.assert.strictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
      done()
    })
  })

  await t.test('route level should not pullute global cache', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/yaml')
      t.assert.strictEqual(res.payload, 'my-custom-string')
      done()
    })
  })

  await t.test('overwrite by fastify reply', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request3',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/yaml')
      t.assert.strictEqual(res.payload, 'foo-bar-baz')
      done()
    })
  })
})

test('serializer without conf', async t => {
  t.plan(2)

  const fastify = Fastify()

  t.after(() => fastify.close())

  await fastify.register(plugin)

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('application/json -> json', (t, done) => {
    t.plan(3)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/json'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.assert.strictEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
      done()
    })
  })

  await t.test('application/yaml -> 406', (t, done) => {
    t.plan(4)

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      t.assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
      t.assert.strictEqual(res.statusCode, 406)
      t.assert.strictEqual(res.payload, JSON.stringify({
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Allowed: application/json'
      }))
      done()
    })
  })
})

test('serializer cache', async t => {
  t.plan(1)

  const fastify = Fastify()

  await fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/cache$/,
        serializer: (body) => body
      }
    ]
  })

  await t.test('it shoud populate cache', (t, done) => {
    t.plan(8)

    fastify.get('/request', async function (req, reply) {
      console.log(reply.serializer.cache)
      t.assert.strictEqual(Object.keys(reply.serializer.cache), ['application/cache'])

      return reply.send('cache')
    })

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      console.log(res.headers['content-type'])
      t.assert.strictEqual(res.headers['content-type'], 'application/cache')
      t.assert.strictEqual(res.payload, 'cache')
    })

    fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    }, (err, res) => {
      t.assert.ifError(err)
      console.log(res.headers['content-type'])
      t.assert.strictEqual(res.headers['content-type'], 'application/cache')
      t.assert.strictEqual(res.payload, 'cache')
      done()
    })
  })
})
