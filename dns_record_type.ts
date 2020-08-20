import { DNSRecordClass } from "./dns_record_class.ts";

/** DNS Record Types. */
export enum DNSRecordType {
  UNKNOWN = 0,
  A = 1,          // IPv4 address record
  AAAA = 28,      // IPv6 address record
  CNAME = 5,      // Canonical name record
  PTR = 12,       // Pointer to a canonical name
}

/** 
 * An abstract class that contains a resource record.
 * 
 * Classes that extend this class must provide a `Payload` that will be added to
 * this resource record when the `Bytes` are generated.
 * 
 * See https://tools.ietf.org/html/rfc1035#section-4.1.3 for details.
 */
export abstract class ResourceRecord {
  Name: string = "";
  NameParts: string[] = [];
  RecordType = DNSRecordType.UNKNOWN;
  RecordClass = DNSRecordClass.UNKNOWN;
  TTL = 0;

  /** Get the bytes for this resource record. */
  get Bytes(): Uint8Array {
    const common = new Uint8Array(this.Name.length + 10);
    let view = new DataView(common.buffer);

    let index = 0;
    for (const part of this.NameParts) {
      view.setUint8(index, part.length);
      for (let i = 0; i < part.length; i++) {
        view.setUint8(index + 1 + i, part.charCodeAt(i));
      }
      index = index + 1 + part.length;
    }

    view.setUint16(index += 1, this.RecordType);
    view.setUint16(index += 2, this.RecordClass);
    view.setUint32(index += 2, this.TTL);

    const payload = this.Payload;
    const result = new Uint8Array(common.length + 2 + payload.length);
    result.set(common, 0);
    view = new DataView(result.buffer);

    view.setUint16(index +=4, payload.length);
    result.set(payload, index += 2);
    
    return result;
  }

  /** Get the payload for this resource record. */
  abstract get Payload(): Uint8Array;
}

/** A Resource Record for 'A' record types. */
export class AResourceRecord extends ResourceRecord {
  constructor(
    readonly Name: string,
    readonly NameParts: string[],
    readonly RecordType: DNSRecordType,
    readonly RecordClass: DNSRecordClass,
    readonly TTL: number,
    readonly Address: number,
  ){
    super();
  }

  /** Returns the IPv4 address as an unsigned 32 bit int. */
  get Payload():Uint8Array {
    const result = new Uint8Array(4);
    const view = new DataView(result.buffer);
  
    view.setUint32(0, this.Address);
    return result;
  }
}