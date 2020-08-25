import { DNSConfig } from "./dns_server_config.ts";

export class Config {
  /** The IP Address which should be used to listen for requests on. */
  public static readonly IP = '0.0.0.0';

  /** The UDP Port that the server will listen on - usually 53 for DNS. */
  public static readonly PORT = 53;

  /** The list of names that the server will serve records for. */
  public static readonly NAMES:DNSConfig = {
    'example.com': {
      ttl: 3600,
      class: {
        'IN': {
          'A': '127.0.0.1',
          // TODO: Currently only A is returned as logic in dns_server shortcircuits the AAAA record.
          'AAAA': '::1',
          'TXT': 'This is some text.',
        }
      }
    },
    'alias.example.com': {
      ttl: 3600,
      class: {
        'IN': {
          'CNAME': 'example.com',
        }
      }
    }
  };
}