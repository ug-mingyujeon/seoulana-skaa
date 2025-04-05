import { SessionKeyManager } from '../sdk';
import * as anchor from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { assert } from 'chai';

describe('UXAA SDK', () => {
  // 테스트용 지갑 생성
  const wallet = new anchor.Wallet(Keypair.generate());
  
  it('should create a session key', () => {
    const sessionManager = new SessionKeyManager(wallet);
    const sessionKey = sessionManager.createSessionKey();
    
    assert.isNotNull(sessionKey);
    assert.isNotNull(sessionKey.publicKey);
    assert.isNotNull(sessionKey.secretKey);
  });
}); 