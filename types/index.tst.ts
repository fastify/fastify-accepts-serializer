import Fastify from 'fastify'
import fastifyAcceptsSerializer from '..'
import { expect } from 'tstyche'

const fastify = Fastify()

// Global serializers
fastify.register(fastifyAcceptsSerializer, {
  serializers: [
    {
      regex: /^application\/json$/,
      serializer: body => JSON.stringify(body)
    }
  ],
  default: 'application/json' // MIME type used if Accept header don't match anything
})

expect(fastify.register).type.not.toBeCallableWith(fastifyAcceptsSerializer, {})
expect(fastify.register).type.not.toBeCallableWith(fastifyAcceptsSerializer, {
  serializers: [],
  default: 1
})
expect(fastify.register).type.not.toBeCallableWith(fastifyAcceptsSerializer, {
  serializers: [{}],
  default: 'application/json'
})

// Per-router serializers
fastify.get('/request', {
  config: {
    serializers: [
      {
        regex: /^application\/json$/,
        serializer: body => JSON.stringify(body)
      }
    ]
  }
}, function (_req, reply) {
  reply.send({ pippo: 'pluto' })
})
