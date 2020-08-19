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
 * See https://tools.ietf.org/html/rfc1035#section-4.1.3 for details.
 */
export abstract class ResourceRecord {
  Name: string = "";
  NameParts: string[] = [];
  RecordType = DNSRecordType.UNKNOWN;
  RecordClass = DNSRecordClass.UNKNOWN;
  TTL = 0;

  get Bytes(): Uint8Array {
    const result = new Uint8Array(this.Name.length + 10);
    const view = new DataView(result.buffer);

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
    
    return result;
  }
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

  get Bytes():Uint8Array {
    const commonBytes = super.Bytes;
    const result = new Uint8Array(commonBytes.length + 6);
    const view = new DataView(result.buffer);
    let offset = commonBytes.length;
    result.set(commonBytes, 0);

    view.setUint16(offset, 4);
    view.setUint32(offset += 2, this.Address);
    return result;
  }
}