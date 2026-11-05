import { BadRequestException, Injectable } from '@nestjs/common';
import { lookup } from 'dns/promises';
import ipaddr from 'ipaddr.js';

@Injectable()
export class WebhookUrlService {
  async validate(urlValue: string): Promise<string> {
    let url: URL;

    try {
      url = new URL(urlValue);
    } catch {
      throw new BadRequestException('Invalid webhook URL.');
    }

    if (url.protocol !== 'https:') {
      throw new BadRequestException('Webhook URLs must use HTTPS.');
    }

    if (url.username || url.password) {
      throw new BadRequestException(
        'Webhook URLs must not contain credentials.',
      );
    }

    // Keep the MVP simple: only allow the standard HTTPS port.
    if (url.port && url.port !== '443') {
      throw new BadRequestException('Webhook URLs must use port 443.');
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');

    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.test') ||
      hostname.endsWith('.invalid') ||
      hostname === 'metadata.google.internal'
    ) {
      throw new BadRequestException('Webhook URL hostname is not allowed.');
    }

    // Validate IP literals directly.
    if (ipaddr.isValid(hostname)) {
      this.assertPublicIp(hostname);
      return url.toString();
    }

    // Resolve DNS and reject the hostname if any returned address
    // is private, reserved, loopback, or otherwise non-public.
    let addresses: Awaited<ReturnType<typeof lookup>>[];

    try {
      addresses = await lookup(hostname, {
        all: true,
        verbatim: true,
      });
    } catch {
      throw new BadRequestException('Webhook hostname could not be resolved.');
    }

    if (addresses.length === 0) {
      throw new BadRequestException('Webhook hostname has no IP addresses.');
    }

    for (const address of addresses) {
      this.assertPublicIp(address.address);
    }

    return url.toString();
  }

  private assertPublicIp(address: string): void {
    if (!ipaddr.isValid(address)) {
      throw new BadRequestException(
        'Webhook URL contains an invalid IP address.',
      );
    }

    const parsed = ipaddr.parse(address);

    // Only globally routable unicast addresses are accepted.
    if (parsed.range() !== 'unicast') {
      throw new BadRequestException(
        'Webhook URLs cannot target private or reserved IP addresses.',
      );
    }
  }
}
