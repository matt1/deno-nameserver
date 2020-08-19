import { hex } from "./utils.ts";
import { DNSRecordType } from "./dns_record_type.ts";
import { DNSRecordClass } from "./dns_record_class.ts";

// Handy picture: https://www.securityartwork.es/wp-content/uploads/2013/02/DNS.jpg

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

/** DNS Packet Header. */
export class DNSHeader {
  Identification: number = 0;
  Flags: number = 0;
  TotalQuestions: number = 0;
  TotalAnswers: number = 0;
  TotalAuthorityResourceRecords: number = 0;
  TotalAdditionalResourceRecords: number = 0;

  public toString(): string {
    return `
      Identification: ${hex(this.Identification)}
               Flags: ${hex(this.Flags)}
     Total Questions: ${hex(this.TotalQuestions)}
       Total Answers: ${hex(this.TotalAnswers)}
       Total Auth RR: ${hex(this.TotalAuthorityResourceRecords)}
 Total Additional RR: ${hex(this.TotalAdditionalResourceRecords)}`;

  
  }

  /** Get the protocol bytes for the header. */
  get Bytes(): Uint8Array {
    const result = new Uint8Array(12);
    const view = new DataView(result.buffer);

    view.setUint16(0, this.Identification);
    view.setUint16(2, this.Flags);

    view.setUint16(4, this.TotalQuestions);
    view.setUint16(6, this.TotalAnswers);

    view.setUint16(8, this.TotalAuthorityResourceRecords);
    view.setUint16(10, this.TotalAdditionalResourceRecords);

    return result;
  }

  /** Parse the DNS header out of the raw packet bytes. */
  static Parse (data: DataView): DNSHeader {
    const header = new DNSHeader();
    header.Identification = data.getInt16(0);
    header.Flags = data.getInt16(2);
    header.TotalQuestions = data.getInt16(4);
    header.TotalAnswers = data.getInt16(6);
    header.TotalAuthorityResourceRecords = data.getInt16(8);
    header.TotalAdditionalResourceRecords = data.getInt16(10);
    return header;
  }
}

/** A DNS Packet's Question. */
export class DNSQuestion {
  Name: string = "";
  NameParts: string[] = [];
  /** The Record Type (e.g. A, AAAA etc). */
  RecordType: number = 0;
  /** The Record Class - typically only IN. */
  RecordClass: number = 0;

  public toString() {
    const recordType = DNSRecordType[this.RecordType];
    const recordClass = DNSRecordClass[this.RecordClass];
    return `Name: ${this.Name} Type: ${recordType} Class: ${recordClass}`;
  }

  /** Get the protocol bytes for the question. */
  get Bytes(): Uint8Array {
    const result = new Uint8Array(this.Name.length + 6);
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
    return result;
  }

  /** Parse the DNS question out of the raw packet bytes. */
  static Parse(data: DataView): DNSQuestion {
    const question = new DNSQuestion();

    let index = 12; // DNS header is always 12 bytes

    // Questions always contain the name split into separate parts, with a
    // leading byte per part indicating its length. A 0x00 byte indicates the
    // end of the name section.
    //
    // E.g. www.example.com ends up as:
    //  Size  Name Part
    //  0x03  www
    //  0x07  example
    //  0x03  com
    //  0x00
    let length = data.getUint8(index);
    while (length != 0) {
      const labelPart = new Uint8Array(data.buffer, index + 1, length);
      const labelPartString = String.fromCharCode.apply(
        null,
        Array.from(labelPart),
      );
      question.NameParts.push(labelPartString);
      index += length + 1;
      length = data.getUint8(index);
    }

    question.Name = question.NameParts.join(".");
    question.RecordType = data.getUint16(index += 1);
    question.RecordClass = data.getUint16(index += 2);

    return question;
  }
}

/** A DNS Packet's Answer. */
export class DNSAnswer extends ResourceRecord {
  // TODO: create subclasses for A, AAAA, MX etc.
  constructor(
    readonly Question: DNSQuestion,
    readonly TTL: number,
    readonly Address: number,
    readonly RecordClass: DNSRecordClass,
    readonly RecordType: DNSRecordType,
  ) {
    super();
    this.Name = Question.Name;
    this.NameParts = Question.NameParts;
  }

  /** Get the protocol bytes for the question. */
  get Bytes(): Uint8Array {
    const recordBytes = super.Bytes;
    const result = new Uint8Array(recordBytes.length + 6);
    const view = new DataView(result.buffer);
    result.set(recordBytes, 0);
    let offset = recordBytes.length;
    
    switch (this.RecordType) {
      case DNSRecordType.A:
        view.setUint16(offset, 4);
        view.setUint32(offset += 2, this.Address);
        break;
      // TODO: IPv6 support
      default:
        throw new Error('Unrecognised record type.');
    }

    console.log(result);
    return result;
  }
}

/** Represents a DNS packet. */
export class DNSPacket {
  /** Copy of the raw data. */
  private readonly rawData: Uint8Array;

  /** Data view onto the raw data. */
  private readonly data: DataView;

  /** Private copy of the header. */
  private header!: DNSHeader;

  /** Private copy of the question. */
  private question!: DNSQuestion;

  /** Private copy of the answer (there may not be an answer). */
  private answer!: DNSAnswer | undefined;

  /** Get the header for this packet. */
  get Header(): DNSHeader {
    if (!this.header) {
      this.header = DNSHeader.Parse(this.data);
    }
    return this.header;
  }

  /** Get the question for this packet. */
  get Question(): DNSQuestion {
    if (!this.question) {
      this.question = DNSQuestion.Parse(this.data);
    }
    return this.question;
  }

  /** Get the answer for this packet, if available. */
  get Answer(): DNSAnswer | undefined {
    return this.answer;
  }

  /** Set the answer for this packet. */
  set Answer(answer:DNSAnswer | undefined) {
    this.answer = answer;
  }

  /** 
   * Get the protocol bytes for this packet. Set any packet fields before
   * calling.
   */
  get Bytes(): Uint8Array {
    const header = this.Header.Bytes;
    const question = this.Question.Bytes;
    const answer = this.Answer?.Bytes;

    let parts = [header, question];
    let length = header.length + question.length;
    if (answer) {
      length += answer.length;
      parts.push(answer);
    }
    const result = new Uint8Array(length);

    let offset = 0;
    for (let array of parts) {
      result.set(array, offset);
      offset += array.length;
    }
    return result;
  }

  /**
   * Construct a new DNSPacket from the provided UInt8Array.
   */
  constructor(data: Uint8Array) {
    this.rawData = data;
    this.data = new DataView(data.buffer);
  }
}
