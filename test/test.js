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
  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('application/yaml -> yaml', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/yaml')
    t.assert.deepStrictEqual(response.payload, YAML.stringify({ pippo: 'pluto' }))
  })

  await t.test('application/x-protobuf -> protobuf', async t => {
    t.plan(2)
    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/x-protobuf')
    t.assert.deepStrictEqual(response.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('application/x-protobuf -> protobuf', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/x-protobuf')
    t.assert.deepStrictEqual(response.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('application/x-msgpack -> msgpack', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/x-msgpack')
    t.assert.deepStrictEqual(response.payload, msgpack.encode({ pippo: 'pluto' }).toString())
  })
})

test('serializer - default = undefined', async t => {
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

  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> 406', async t => {
    t.plan(3)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepStrictEqual(response.statusCode, 406)
    t.assert.deepStrictEqual(response.payload, JSON.stringify({
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Allowed: /^application\\/yaml$/,application/json'
    }))
  })
})

test('serializer - default = application/json by fastify', async t => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [],
    default: 'application/json'
  })

  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> json', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepStrictEqual(response.payload, JSON.stringify({ pippo: 'pluto' }))
  })
})

test('serializer - default = application/json by custom', async t => {
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

  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> json', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/json')
    t.assert.deepStrictEqual(response.payload, 'my-custom-string')
  })
})

test('serializer - default = application/yaml', async t => {
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

  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('no match -> yaml', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'text/html'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/yaml')
    t.assert.deepStrictEqual(response.payload, YAML.stringify({ pippo: 'pluto' }))
  })
})

test('serializer per route', async t => {
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

  fastify.get('/request', function (_req, reply) {
    reply
      .serializer(_ => 'my-custom-string')
      .send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (_req, reply) {
    reply
      .type('application/x-msgpack')
      .serializer(_ => 'my-custom-string-msgpack')
      .send({ pippo: 'pluto' })
  })

  await t.test('overwrite', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/yaml')
    t.assert.deepStrictEqual(response.payload, 'my-custom-string')
  })

  await t.test('not defined globally', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/x-msgpack'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/x-msgpack')
    t.assert.deepStrictEqual(response.payload, 'my-custom-string-msgpack')
  })
})

test('serializer per route through route option', async t => {
  t.plan(3)

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

  fastify.get('/request', { config }, function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  fastify.get('/request2', function (_req, reply) {
    reply.send('my-custom-string')
  })

  fastify.get('/request3', function (_req, reply) {
    reply
      .serializer(_ => 'foo-bar-baz')
      .send({ pippo: 'pluto' })
  })

  await t.test('application/x-protobuf -> protobuf', async t => {
    t.plan(2)
    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/x-protobuf'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/x-protobuf')
    t.assert.deepStrictEqual(response.payload, AwesomeMessage.encode(AwesomeMessage.create({ pippo: 'pluto' })).finish().toString())
  })

  await t.test('route level should not pullute global cache', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request2',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/yaml')
    t.assert.deepStrictEqual(response.payload, 'my-custom-string')
  })

  await t.test('overwrite by fastify reply', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request3',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/yaml')
    t.assert.deepStrictEqual(response.payload, 'foo-bar-baz')
  })
})

test('serializer without conf', async t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(plugin)

  fastify.get('/request', function (_req, reply) {
    reply.send({ pippo: 'pluto' })
  })

  await t.test('application/json -> json', async t => {
    t.plan(2)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/json'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepStrictEqual(response.payload, JSON.stringify({ pippo: 'pluto' }))
  })

  await t.test('application/yaml -> 406', async t => {
    t.plan(3)

    const response = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/yaml'
      }
    })

    t.assert.deepStrictEqual(response.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepStrictEqual(response.statusCode, 406)
    t.assert.deepStrictEqual(response.json(), {
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Allowed: application/json'
    })
  })
})

test('serializer cache', async t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(plugin, {
    serializers: [
      {
        regex: /^application\/cache$/,
        serializer: (body) => body
      }
    ]
  })

  await t.test('it shoud populate cache', async t => {
    t.plan(6)

    fastify.get('/request', function (_req, reply) {
      t.assert.deepStrictEqual(Object.keys(reply.serializer.cache), ['application/cache'])

      reply.send('cache')
    })

    const response1 = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    })

    t.assert.deepStrictEqual(response1.headers['content-type'], 'application/cache')
    t.assert.deepStrictEqual(response1.payload, 'cache')

    const response2 = await fastify.inject({
      method: 'GET',
      url: '/request',
      payload: {},
      headers: {
        accept: 'application/cache'
      }
    })

    t.assert.deepStrictEqual(response2.headers['content-type'], 'application/cache')
    t.assert.deepStrictEqual(response2.payload, 'cache')
  })
})
