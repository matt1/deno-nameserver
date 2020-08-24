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
    
    let records:DNSConfigRecord[] = [];
    try {
      // Special handling for A records: if we don't have an A record, check to
      // see if we have a CNAME for it, then get the A record for the CNAME
      // destination if we do.
      //
      // This is special processing only for CNAMEs - see the RFC for details:
      // https://tools.ietf.org/html/rfc1034#section-3.6.2
      if (question.RecordType == DNSRecordType.A || DNSRecordType.AAAA) {
        // A record request - handle CNAME special case.
        if (!this.hasRecord(question.Name, question.RecordType)) {
          // No A record found - look for a CNAME and follow it.
          let cnameRecord = this.getRecord(question.Name, DNSRecordType.CNAME);
          records.push(cnameRecord);
          if (cnameRecord) {
            const cnameDestination = cnameRecord.class[DNSRecordClass[question.RecordClass]][DNSRecordType[DNSRecordType.CNAME]];
            if (this.hasRecord(cnameDestination, question.RecordType)) {
              records.push(this.getRecord(cnameDestination, question.RecordType));
            }
          }
        } else {
          records.push(this.getRecord(question.Name, question.RecordType));
        }

      } else {
        // Not an A record request - carry on as usual.
        records.push(this.getRecord(question.Name, question.RecordType));
      }
    } catch (error) {
      console.error(`Error handling request: ${error}`);
      return request;
    }
 
    console.log(`Serving request: ${packet.Question}`);
    packet.Header.Flags = 32768; // 0x8000
    for (const record of records) {
      const rrType = this.getResourceRecordType(packet.Question, record);
      if (rrType) packet.Answers.push(rrType);
    }
    packet.Header.TotalAnswers = packet.Answers.length;
    return new Uint8Array(packet.Bytes);
  }

  /** 
   * Checks for a config record by name, type, and optionally class (class 
   * defaults to `IN` if not set).
   */
  private hasRecord(name:string,
      recordType:DNSRecordType,
      recordClass:DNSRecordClass = DNSRecordClass.IN): boolean {
    const config = this.config[name];
    if (!config) return false;
    if (!config.class[DNSRecordClass[recordClass]]) return false;
    if (!config.class[DNSRecordClass[recordClass]][DNSRecordType[recordType]]) return false;
    return true;
  }

    /** 
   * Get the config record by name, type, and optionally class (class defaults
   * to `IN` if not set).
   */
  private getRecord(name:string,
    recordType:DNSRecordType,
    recordClass:DNSRecordClass = DNSRecordClass.IN): DNSConfigRecord {
  const config = this.config[name];

  if (!config) throw new Error(`No config for ${name}`);
  if (!config.class[DNSRecordClass[recordClass]]) throw new Error(`No config for class '${recordClass}' for ${name}`);
  if (!config.class[DNSRecordClass[recordClass]][DNSRecordType[recordType]]) throw new Error(`No config for type '${recordType}' for ${name}`);
  
  return config;
}

  /** Get an appropriate record type for the question using the config. */
  private getResourceRecordType(question:DNSQuestion, config:DNSConfigRecord):ResourceRecord | undefined {
    const classConfig = config.class[DNSRecordClass[question.RecordClass]];
    let rr:ResourceRecord|undefined;
    
    // TODO: make records strongly typed to avoid this mess
    if (classConfig.hasOwnProperty(DNSRecordType[DNSRecordType.A])) {
      rr = new AResourceRecord(question.Name, question.NameParts,
          question.RecordType, question.RecordClass, config.ttl);
      (rr as AResourceRecord).Address =
          numberToIpv4(classConfig[DNSRecordType[DNSRecordType.A]]);
    } else if (classConfig.hasOwnProperty(DNSRecordType[DNSRecordType.CNAME])) {
      rr = new CNameResourceRecord(question.Name, question.NameParts,
          question.RecordType, question.RecordClass, config.ttl);
      (rr as CNameResourceRecord).CName =
          classConfig[DNSRecordType[DNSRecordType.CNAME]];
    }

    return rr;
  }
}
