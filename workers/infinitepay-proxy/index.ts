/**
 * Cloudflare Worker do Checkout Integrado.
 * Empacota src/lib/checkout-proxy.ts. Deploy e segredos: docs/checkout-infinitepay.md.
 */
import { handleCheckoutRequest, type ProxyEnv } from '../../src/lib/checkout-proxy.ts';

export default {
  fetch(request: Request, env: ProxyEnv): Promise<Response> {
    return handleCheckoutRequest(request, env);
  },
};
