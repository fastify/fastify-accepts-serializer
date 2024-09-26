'use strict'

const t = require('node:test')
const assert = require('node:assert')
const test = t.test

const plugin = require('../')
const Fastify = require('fastify')
const protobuf = require('protobufjs')
const YAML = require('yamljs')
const msgpack = require('msgpack5')()

const root = protobuf.loadSync('test/awesome.proto')
const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage')

test('serializer', async t => {
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

  await t.test('application/yaml -> yaml', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/yaml')
    assert.deepStrictEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
  })

  await t.test('application/x-protobuf -> protobuf', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/x-protobuf')
    assert.deepStrictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('application/x-protobuf -> protobuf', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/x-protobuf')
    assert.deepStrictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('application/x-msgpack -> msgpack', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/x-msgpack')
    assert.deepStrictEqual(res.payload, msgpack.encode({ pippo: 'pluto' }).toString())
  })
})

test('serializer - default = undefined', async t => {
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

  await t.test('no match -> 406', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    assert.deepStrictEqual(res.statusCode, 406)
    assert.deepStrictEqual(res.payload, JSON.stringify({
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Allowed: /^application\\/yaml$/,application/json'
    }))
  })
})

test('serializer - default = application/json by fastify', async t => {
  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [],
    default: 'application/json'
  })

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> json', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    assert.deepStrictEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
  })
})

test('serializer - default = application/json by custom', async t => {
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

  await t.test('no match -> json', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/json')
    assert.deepStrictEqual(res.payload, 'my-custom-string')
  })
})

test('serializer - default = application/yaml', async t => {
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

  await t.test('no match -> yaml', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/yaml')
    assert.deepStrictEqual(res.payload, YAML.stringify({ pippo: 'pluto' }))
  })
})

test('serializer per route', async t => {
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

  await t.test('overwrite', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/yaml')
    assert.deepStrictEqual(res.payload, 'my-custom-string')
  })

  await t.test('not defined globally', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/x-msgpack')
    assert.deepStrictEqual(res.payload, 'my-custom-string-msgpack')
  })
})

test('serializer per route through route option', async t => {
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

  await t.test('application/x-protobuf -> protobuf', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/x-protobuf')
    assert.deepStrictEqual(res.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('route level should not pullute global cache', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/yaml')
    assert.deepStrictEqual(res.payload, 'my-custom-string')
  })

  await t.test('overwrite by fastify reply', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request3',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/yaml')
    assert.deepStrictEqual(res.payload, 'foo-bar-baz')
  })
})

test('serializer without conf', async t => {
  const fastify = Fastify()

  fastify.register(plugin)

  fastify.get('/request', function (req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('application/json -> json', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/json'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    assert.deepStrictEqual(res.payload, JSON.stringify({ pippo: 'pluto' }))
  })

  await t.test('application/yaml -> 406', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    assert.deepStrictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    assert.deepStrictEqual(res.statusCode, 406)
    assert.deepStrictEqual(res.payload, JSON.stringify({
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Allowed: application/json'
    }))
  })
})

test('serializer cache', async t => {
  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/cache$/,
        serializer: (body) => body
      }
    ]
  })

  await t.test('it shoud populate cache', async () => {
    fastify.get('/request', function (req, reply) {
      assert.deepStrictEqual(Object.keys(reply.serializer.cache), ['application/cache'])

      reply.send('cache')
    })

    const res1 = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    })

    assert.deepStrictEqual(res1.headers['content-type'], 'application/cache')
    assert.deepStrictEqual(res1.payload, 'cache')

    const res2 = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    })

    assert.deepStrictEqual(res2.headers['content-type'], 'application/cache')
    assert.deepStrictEqual(res2.payload, 'cache')
  })
})
