import { hex } from "./utils.ts";
import { DNSRecordType, ResourceRecord } from "./dns_record_type.ts";
import { DNSRecordClass } from "./dns_record_class.ts";

// Handy picture: https://www.securityartwork.es/wp-content/uploads/2013/02/DNS.jpg

/** DNS Packet Header. */
export class DNSHeader {
  Identification = 0;
  Flags = 0;
  TotalQuestions = 0;
  TotalAnswers = 0;
  TotalAuthorityResourceRecords = 0;
  TotalAdditionalResourceRecords = 0;

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
  /** The human-friendly name */
  Name = "";
  /** The separate parts of the name. */
  NameParts: string[] = [];
  /** The Record Type (e.g. A, AAAA etc). */
  RecordType = 0;
  /** The Record Class - typically only IN. */
  RecordClass = 0;

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
  private answers: ResourceRecord[] = [];

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
  get Answers(): ResourceRecord[] {
    return this.answers;
  }

  /** 
   * Get the protocol bytes for this packet. Set any packet fields before
   * calling.
   */
  get Bytes(): Uint8Array {
    const header = this.Header.Bytes;
    const question = this.Question.Bytes;

    let parts = [header, question];
    let length = header.length + question.length;
    for (const answer of this.Answers) {
      const bytes = answer.Bytes;
      length += bytes.length;
      parts.push(bytes);
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
