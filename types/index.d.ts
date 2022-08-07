import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  export interface FastifyContextConfig {
    serializers: SerializerConfig[];
  }
}

interface SerializerConfig {
  regex: RegExp;
  serializer: (body: any) => string;
}

interface FastifyAcceptsSerializerPluginOptions {
  serializers: SerializerConfig[];
  default: string;
}

declare const fastifyAcceptsSerializer: FastifyPluginCallback<FastifyAcceptsSerializerPluginOptions>;

export default fastifyAcceptsSerializer;
