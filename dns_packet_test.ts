import { assertEquals, assert} from "https://deno.land/std/testing/asserts.ts";
import { DNSPacket } from "./dns_packet.ts";
import { DNSRecordClass } from "./dns_record_class.ts";
import { DNSRecordType } from "./dns_record_type.ts";

Deno.test('DNSPacket can be created from raw request bytes', () => {
  const data =  Uint8Array.from([0, 5, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 7, 101,
      120, 97, 109, 112, 108, 101, 3, 99, 111, 109, 0, 0, 1, 0, 1]);
  
  const packet = new DNSPacket(data);

  assertEquals(packet.Header.Identification, 5);
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
