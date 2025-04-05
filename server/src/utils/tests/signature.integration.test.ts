import * as ed25519 from 'noble-ed25519';
import { verifySignature } from '../solanaUtils';
import crypto from 'crypto';

// Add debug utility
function toHex(data: Uint8Array): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('Signature verification integration test', () => {
  it('should correctly verify a valid signature with real keypair', async () => {
    // Generate a private key (32 bytes)
    const privateKey = crypto.randomBytes(32);
    const privateKeyHex = Buffer.from(privateKey).toString('hex');
    
    // Derive the public key from the private key
    const publicKey = await ed25519.getPublicKey(privateKeyHex);    
    const publicKeyUint8Array = Uint8Array.from(Buffer.from(publicKey, 'hex'));
    console.log('PublicKeyUint8Array (hex):', toHex(publicKeyUint8Array));
    
    // Log the length to verify it's the right size
    console.log('Public key length:', publicKey.length);
    console.log('PublicKeyUint8Array length:', publicKeyUint8Array.length);
    
    // Create a message
    const message = Buffer.from('This is a test message');
    console.log('Message (hex):', toHex(message));
    
    // Sign the message with the private key
    const signature = await ed25519.sign(message, privateKeyHex);
    console.log('Signature (hex):', toHex(signature));
    
    // Verify the signature with our utility function
    const isValid = await verifySignature(message, signature, publicKeyUint8Array);
    
    // Assertion
    expect(isValid).toBe(true);
  });
  
  it('should reject an invalid signature', async () => {
    // Generate a private key (32 bytes)
    const privateKey = crypto.randomBytes(32);
    const privateKeyHex = Buffer.from(privateKey).toString('hex');
    
    // Derive the public key from the private key
    const publicKey = await ed25519.getPublicKey(privateKeyHex);
    const publicKeyUint8Array = Uint8Array.from(Buffer.from(publicKey, 'hex'));
    
    // Create a message
    const message = Buffer.from('This is a test message');
    
    // Sign the message with the private key
    const signature = await ed25519.sign(message, privateKeyHex);
    
    // Modify the message after signing
    const alteredMessage = Buffer.from('This is a modified message');
    
    // Try to verify with the altered message
    const isValid = await verifySignature(alteredMessage, signature, publicKeyUint8Array);
    
    // Assertion - should fail because message was changed
    expect(isValid).toBe(false);
  });
}); 