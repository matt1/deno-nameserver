import { DNSPacket, DNSAnswer } from "./dns_packet.ts";
import { DNSConfig } from "./dns_server_config.ts";
import { DNSRecordClass } from "./dns_record_class.ts";
import { DNSRecordType } from "./dns_record_type.ts";
import { numberToIpv4 } from "./utils.ts";


/** A simple DNS Server. */
export class DNSServer {

  serverConfig: DNSConfig = {
    "example.com": {
      "IN": {
        "A": "127.0.0.1",
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

    let address;
    try {
      address = this.serverConfig[question.Name][recordClass][recordType];
      if (!address) throw new Error();
    } catch (error) {
      console.log(`No config found for ${packet.Question}`);
      return request;
    }
 
    console.log(`Serving request: ${packet.Question}`);
    return this.createResponse(packet, address);
  }

  private createResponse(packet: DNSPacket, address:string): Uint8Array {
    packet.Header.Flags = 32768; // 0x8000
    packet.Header.TotalAnswers = 1;
    packet.Answer = new DNSAnswer(
      packet.Question,
      60,
      numberToIpv4(address),
      packet.Question.RecordType,
      packet.Question.RecordClass,
    );
    return new Uint8Array(packet.Bytes);
  }
}
