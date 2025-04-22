declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute<T>(request: any): Promise<{ result: T }>;
    }
    
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  
  namespace orders {
    class OrdersCreateRequest {
      constructor();
      prefer(prefer: string): void;
      requestBody(body: any): void;
    }
    
    class OrdersCaptureRequest {
      constructor(orderId: string);
      prefer(prefer: string): void;
    }
  }
}