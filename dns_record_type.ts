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
  constructor(
    readonly Name = '',
    readonly NameParts: string[] = [],
    readonly RecordType = DNSRecordType.UNKNOWN,
    readonly RecordClass = DNSRecordClass.UNKNOWN,
    readonly TTL = 0,
  ){}

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
  /** The IPv4 address (as a decimal). */
  Address: number = 0;

  /** Returns the IPv4 address as an unsigned 32 bit int. */
  get Payload():Uint8Array {
    const result = new Uint8Array(4);
    const view = new DataView(result.buffer);
  
    view.setUint32(0, this.Address);
    return result;
  }
}

/** A Resource Record for CNAMEs. */
export class CNameResourceRecord extends ResourceRecord {
  /** The CNAME alias. */
  CName = '';

  get Payload():Uint8Array {
    const result = new Uint8Array(this.CName.length + 2);
    const view = new DataView(result.buffer);
  
    let index = 0;
    for (const part of this.CName.split('.')) {
      view.setUint8(index, part.length);
      for (let i = 0; i < part.length; i++) {
        view.setUint8(index + 1 + i, part.charCodeAt(i));
      }
      index = index + 1 + part.length;
    }

    return result;
  }
}

/** A Resource Record for TXT. */
export class TxtResourceRecord extends ResourceRecord {
  /** The TXT value. */
  Txt = '';

  get Payload():Uint8Array {
    const result = new Uint8Array(this.Txt.length);
    const view = new DataView(result.buffer);
  
    for (let i = 0; i<this.Txt.length; i++) {
      view.setUint8(i, this.Txt.charCodeAt(i));
    }
    return result;
  }
}