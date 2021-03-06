/**
 * Config for the server is a JSON file keyed by name, then record class (only
 * "IN" (aka Internet) is supported), then the record types and values.
 * 
 * So if you wanted to resolve the IPv4 address `127.0.0.1` and IPv6 address
 * `::1` for requests for `example.com` you'd have a config like this:
 * 
 *  {
 *  "example.com" : {
 *    "ttl": 3600,
 *    "class": {
 *      "IN" : {
 *          "A": "127.0.0.1",
 *          "AAAA": "::1",
 *      },
 *    },
 *  },        
};
 */

export interface DNSConfig {
  [key:string]: DNSConfigRecord;
}

export interface DNSConfigRecord {
  ttl: number,
  class: {
    [key:string]: DNSConfigRecordClass;
  }
}

interface DNSConfigRecordClass {
  [key:string]: string;
}
