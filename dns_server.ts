import { DNSPacket, DNSQuestion } from "./dns_packet.ts";
import { DNSConfigRecord, DNSConfig } from "./dns_server_config.ts";
import { DNSRecordClass } from "./dns_record_class.ts";
import { DNSRecordType, AResourceRecord, ResourceRecord, CNameResourceRecord } from "./dns_record_type.ts";
import { numberToIpv4 } from "./utils.ts";

/** A simple DNS Server. */
export class DNSServer {
  constructor(private readonly config:DNSConfig){}
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
    let record;
    try {
      config = this.config[question.Name];
      
      if (!config) throw new Error(`No config for ${question.Name}`);
      if (!config.class[recordClass]) throw new Error(`No config for class '${recordClass}' for ${question.Name}`);
      if (!config.class[recordClass][recordType]) throw new Error(`No config for type '${recordType}' for ${question.Name}`);

      record = config.class[recordClass][recordType];

      if (!record) throw new Error(`No record`);
    } catch (error) {
      console.error(`Error handling request: ${error}`);
      return request;
    }
 
    console.log(`Serving request: ${packet.Question}`);
    return this.createResponse(packet, config);
  }

  private createResponse(packet: DNSPacket, config:DNSConfigRecord): Uint8Array {    
    packet.Header.Flags = 32768; // 0x8000
    packet.Header.TotalAnswers = 1;
    packet.Answer = this.getResourceRecordType(packet.Question, config);
    return new Uint8Array(packet.Bytes);
  }

  /** Get an appropriate record type for the question using the config. */
  private getResourceRecordType(question:DNSQuestion, config:DNSConfigRecord):ResourceRecord {
    const classConfig = config.class[DNSRecordClass[question.RecordClass]];
    let rr:ResourceRecord;
    switch (question.RecordType) {
      case DNSRecordType.A:
        rr = new AResourceRecord(question.Name, question.NameParts,
            question.RecordType, question.RecordClass, config.ttl);
        (rr as AResourceRecord).Address =
            numberToIpv4(classConfig[DNSRecordType[DNSRecordType.A]]);
        break;
      case DNSRecordType.CNAME:
        rr = new CNameResourceRecord(question.Name, question.NameParts,
            question.RecordType, question.RecordClass, config.ttl);
        (rr as CNameResourceRecord).CName =
            classConfig[DNSRecordType[DNSRecordType.CNAME]];
        break;
      default:
        throw new Error(`Unable to create Resource Record instance for type ${question.RecordType}`);
    }
    return rr;
  }
}
