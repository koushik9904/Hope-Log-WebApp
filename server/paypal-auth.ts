import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from './db';
import axios from 'axios';

// Cache to store the token and its expiration
let tokenCache: {
  accessToken: string;
  expiresAt: number;
} | null = null;

// Get PayPal credentials from database
export async function getPayPalCredentials() {
  try {
    const clientIdRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_id"))
      .limit(1);
    
    const clientSecretRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_secret"))
      .limit(1);
    
    const modeRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_mode"))
      .limit(1);
    
    return {
      clientId: clientIdRecord.length > 0 ? clientIdRecord[0].value : '',
      clientSecret: clientSecretRecord.length > 0 ? clientSecretRecord[0].value : '',
      mode: modeRecord.length > 0 ? modeRecord[0].value : "sandbox"
    };
  } catch (err) {
    console.warn("[PayPal] Error fetching PayPal credentials from settings:", err);
    return { clientId: '', clientSecret: '', mode: "sandbox" };
  }
}

/**
 * Get PayPal API URL based on mode (sandbox or live)
 */
export function getPayPalApiUrl(mode: string = 'sandbox'): string {
  return mode === 'sandbox' 
    ? 'https://api-m.sandbox.paypal.com' 
    : 'https://api-m.paypal.com';
}

/**
 * Get an OAuth 2.0 access token for PayPal API
 * This follows PayPal's authentication requirements
 */
export async function getPayPalAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    console.log('[PayPal] Using cached access token');
    return tokenCache.accessToken;
  }

  console.log('[PayPal] Getting new access token');
  
  // Get credentials from database
  const { clientId, clientSecret, mode } = await getPayPalCredentials();
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or secret not found');
  }
  
  // Create Basic auth string with Base64 encoding
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Set API URL based on mode
  const apiUrl = getPayPalApiUrl(mode);
  
  try {
    // Make OAuth token request
    const response = await axios({
      method: 'post',
      url: `${apiUrl}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      data: 'grant_type=client_credentials'
    });
    
    // Extract token and expiration
    const { access_token, expires_in } = response.data;
    
    if (!access_token) {
      throw new Error('No access token returned from PayPal');
    }
    
    // Calculate expiration time (expires_in is in seconds, convert to milliseconds)
    // Subtract 5 minutes (300,000 ms) as a buffer
    const expiresAt = Date.now() + (expires_in * 1000) - 300000;
    
    // Cache the token
    tokenCache = {
      accessToken: access_token,
      expiresAt
    };
    
    console.log('[PayPal] Successfully obtained new access token');
    return access_token;
  } catch (error: any) {
    console.error('[PayPal] Error getting access token:', error.message);
    
    // Log more detailed error info if available
    if (error.response) {
      console.error('[PayPal] Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw new Error(`Failed to get PayPal access token: ${error.message}`);
  }
}

/**
 * Make an authenticated request to PayPal API
 */
export async function makePayPalRequest(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: any,
  additionalHeaders: Record<string, string> = {}
) {
  try {
    // Get credentials to determine API URL
    const { mode } = await getPayPalCredentials();
    const apiUrl = getPayPalApiUrl(mode);
    
    // Get access token
    const accessToken = await getPayPalAccessToken();
    
    // Make the authenticated request
    const response = await axios({
      method,
      url: `${apiUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...additionalHeaders
      },
      data
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`[PayPal] Error making ${method.toUpperCase()} request to ${endpoint}:`, error.message);
    
    // Log more detailed error info if available
    if (error.response) {
      console.error('[PayPal] Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw new Error(`PayPal API request failed: ${error.message}`);
  }
}