import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  export interface FastifyContextConfig {
    serializers: fastifyAcceptsSerializer.SerializerConfig[];
  }
}

type FastifyAcceptsSerializer = FastifyPluginCallback<fastifyAcceptsSerializer.FastifyAcceptsSerializerPluginOptions>;

declare namespace fastifyAcceptsSerializer {
  export interface SerializerConfig {
    regex: RegExp;
    serializer: (body: any) => string;
  }
  
  export interface FastifyAcceptsSerializerPluginOptions {
    serializers: SerializerConfig[];
    default: string;
  }

  export const fastifyAcceptsSerializer: FastifyAcceptsSerializer
  export { fastifyAcceptsSerializer as default }
}

declare function fastifyAcceptsSerializer(...params: Parameters<FastifyAcceptsSerializer>): ReturnType<FastifyAcceptsSerializer>
export = fastifyAcceptsSerializer
