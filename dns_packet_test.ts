import { assertEquals, assert} from "https://deno.land/std/testing/asserts.ts";
import { DNSPacket } from "./dns_packet.ts";
import { DNSRecordClass } from "./dns_record_class.ts";
import { DNSRecordType } from "./dns_record_type.ts";

Deno.test('DNSPacket can be created from raw request bytes', () => {
  // Direct from a wireshark DNS capture made by Win10 `nslookup`.
  const data =  Uint8Array.from([
      0x00, 0x04, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x65, 0x78, 0x61,
      0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01,
  ]);
  const packet = new DNSPacket(data);

  assertEquals(packet.Header.Identification, 4);
  assertEquals(packet.Header.TotalQuestions, 1);
  assertEquals(packet.Header.TotalAnswers, 0);
  assertEquals(packet.Header.TotalAdditionalResourceRecords, 0);
  assertEquals(packet.Header.TotalAuthorityResourceRecords, 0);
  assertEquals(packet.Header.Flags, 256);

  assertEquals(packet.Question.Name, 'example.com');
  assertEquals(packet.Question.NameParts, ['example', 'com']);
  assertEquals(packet.Question.RecordClass, DNSRecordClass.IN);
  assertEquals(packet.Question.RecordType, DNSRecordType.A);

  assertEquals(packet.Answer, undefined);
});
