'use strict'

const fp = require('fastify-plugin')
const SerializerManager = require('./SerializerManager')

const FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE = 'application/json'

function acceptsSerializerPlugin (fastify, options, next) {
  const globalSerializerManager = SerializerManager.build(options)

  const defaultSerializer = globalSerializerManager.findSerializer([options.default])

  fastify.register(require('fastify-accepts'))

  fastify.addHook('preHandler', (request, reply, done) => {
    const types = request.types()
    let serializer
    let type

    if (!reply.serializer) {
      reply.serializer = {}
    }

    if (!reply.serializer.serializerManager) {
      reply.serializer.serializerManager = SerializerManager.expand(reply.serializer, globalSerializerManager)
    }

    const serializerManager = reply.serializer.serializerManager

    const s = serializerManager.findSerializer(types)
    serializer = s.serializer
    type = s.type

    if (!serializer && defaultSerializer) {
      serializer = defaultSerializer.serializer
      type = defaultSerializer.type
    }

    if (!serializer &&
            options.default !== FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE &&
            !request.type(FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE)) {
      const supportedTypes = serializerManager.getSupportedTypes()
        .concat([FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE])

      const notAcceptable = new Error('Allowed: ' + supportedTypes.join(','))
      return reply.code(406).send(notAcceptable)
    }

    if (serializer) {
      reply.type(type)
      reply._serializer = serializer.serializeFunction
    }

    done()
  })
  next()
}

module.exports = fp(acceptsSerializerPlugin, {
  fastify: '>1.0.0 <2.0.0',
  name: 'fastify-accepts-serializer'
})
