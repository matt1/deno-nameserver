import { DNSPacket, DNSAnswer } from "./dns_packet.ts";
import { DNSConfig, DNSConfigRecord } from "./dns_server_config.ts";
import { DNSRecordClass } from "./dns_record_class.ts";
import { DNSRecordType } from "./dns_record_type.ts";
import { numberToIpv4 } from "./utils.ts";


/** A simple DNS Server. */
export class DNSServer {

  serverConfig: DNSConfig = {
    "api.github.com": {
      ttl: 3600,
      class: {
        "IN": {
          "A": "127.0.0.1",
        }
      }
    },
    "example.com": {
      ttl: 3600,
      class: {
        "IN": {
          "A": "127.0.0.1",
        }
      }
    }
  };

  /** 
   * Handles a raw DNS request. Request payload should be the raw datagram
   * content.
   * 
   * Returns the raw bytes for a DNS response to the request.
   */
  public HandleRequest(request: Uint8Array): Uint8Array {
    const packet = new DNSPacket(request);
    const header = packet.Header;
    const question = packet.Question;

    const recordClass = DNSRecordClass[question.RecordClass];
    const recordType = DNSRecordType[question.RecordType];
    
    let config:DNSConfigRecord;
    let address;
    try {
      config = this.serverConfig[question.Name];
      if (!config) throw new Error(`No config for ${question.Name}`);

      if (!config.class[recordClass]) throw new Error(`No config for class '${recordClass}' for ${question.Name}`);
      if (!config.class[recordClass][recordType]) throw new Error(`No config for type '${recordType}' for ${question.Name}`);
      address = config.class[recordClass][recordType];
      if (!address) throw new Error(`No address`);
    } catch (error) {
      console.error(`Error handling request: ${error}`);
      return request;
    }
 
    console.log(`Serving request: ${packet.Question}`);
    return this.createResponse(packet, config);
  }

  private createResponse(packet: DNSPacket, config:DNSConfigRecord): Uint8Array {    
    const recordClass = DNSRecordClass[packet.Question.RecordClass];
    const recordType = DNSRecordType[packet.Question.RecordType];
    const address = config.class[recordClass][recordType];

    packet.Header.Flags = 32768; // 0x8000
    packet.Header.TotalAnswers = 1;
    packet.Answer = new DNSAnswer(
      packet.Question,
      config.ttl,
      numberToIpv4(address),
      packet.Question.RecordType,
      packet.Question.RecordClass,
    );
    return new Uint8Array(packet.Bytes);
  }
}
