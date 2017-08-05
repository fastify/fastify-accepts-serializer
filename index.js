'use strict'

const fp = require('fastify-plugin')
const Boom = require('boom')

const SerializerManager = require('./SerializerManager')

const FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE = 'application/json'

function acceptsSerializerPlugin (fastify, options, next) {
  const serializerManager = SerializerManager.build(options)

  const defaultSerializer = serializerManager.findSerializer([options.default])

  fastify.register(require('fastify-accepts'), err => {
    if (err) return next(err)

    fastify.addHook('preHandler', (request, reply, done) => {
      const types = request.types()
      const s = serializerManager.findSerializer(types)
      let serializer = s.serializer
      let type = s.type

      if (!serializer && defaultSerializer) {
        serializer = defaultSerializer.serializer
        type = defaultSerializer.type
      }

      if (!serializer && options.default !== FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE) {
        return reply.code(406).type('application/json').send(Boom.notAcceptable('Allowed: ' + serializerManager.getSupportedTypes().join(',')))
      }

      if (serializer) {
        reply.type(type)
        reply._serializer = serializer.serializeFunction
      }

      done()
    })

    next()
  })
}

module.exports = fp(acceptsSerializerPlugin)
