import type { Decoder, Encoder, LightNode } from '@waku/sdk';
import {
  createLightNode,
  waitForRemotePeer,
  type Protocols,
  createEncoder,
  createDecoder,
} from '@waku/sdk';
import type protobuf from 'protobufjs';
import type { TopicType } from 'src/types';

export class WakuService {
  #protocols: [Protocols];

  #topic: string;

  #node?: LightNode;

  #encoder: Encoder;

  #decoder: Decoder;

  constructor(protocols: [Protocols], topic: TopicType) {
    this.#protocols = protocols;
    this.#topic = topic;
    this.#encoder = createEncoder({
      contentTopic: this.#topic,
      ephemeral: true,
    });
    this.#decoder = createDecoder(this.#topic);
  }

  async connectNode() {
    const node = await createLightNode({ defaultBootstrap: true });
    await node.start();
    await waitForRemotePeer(node, this.#protocols);

    this.#node = node;
  }

  sendMessage = async (
    msgType: protobuf.Type,
    msgContent: Record<string, any>,
  ) => {
    if (!this.#node) {
      throw Error('Node not initialised');
    }
    const serialisedMsg = msgType.encode(msgType.create(msgContent)).finish();
    await this.#node.lightPush.send(this.#encoder, {
      payload: serialisedMsg,
    });
  };
}
