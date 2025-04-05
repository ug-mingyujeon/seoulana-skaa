import { SessionKeyManager } from '../sdk';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('UXAA SDK 예제 실행 중...');

  // 연결 설정
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // 지갑 설정 (로컬 키파일에서 로드)
  const keypairFile = path.resolve(__dirname, '../keypair.json');
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairFile, 'utf-8')))
  );
  const wallet = new anchor.Wallet(walletKeypair);
  
  console.log(`지갑 주소: ${wallet.publicKey.toString()}`);
  
  // AA 릴레이 프로그램 설정
  const programId = new anchor.web3.PublicKey('AaReLaY111111111111111111111111111111111');
  
  // IDL 로드
  const idl = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../idl/aa_relay.json'), 'utf-8'));
  
  // 프로그램 인스턴스 생성
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, programId, provider);
  
  // 세션 키 매니저 생성
  const sessionManager = new SessionKeyManager(wallet, connection);
  
  // 새 세션 키 생성
  const sessionKey = sessionManager.createSessionKey();
  console.log(`생성된 세션 키: ${sessionKey.publicKey.toString()}`);
  
  // 세션 키 등록 트랜잭션 생성
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expiresAt = currentTimestamp + (60 * 60); // 1시간 후 만료
  
  const registerTx = await sessionManager.createRegisterSessionTransaction(
    program,
    sessionKey, 
    expiresAt
  );
  
  // 트랜잭션 서명 및 전송
  const signature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    registerTx,
    [walletKeypair]
  );
  
  console.log(`세션 키 등록 트랜잭션 완료: ${signature}`);
  
  // 서비스 호출 예시 (토큰 전송)
  const targetProgramId = new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const functionId = 3; // 예: 토큰 전송 함수 ID
  const params = Buffer.from([/* 인코딩된 파라미터 */]);
  
  const relayTx = await sessionManager.createRelayTransaction(
    program,
    sessionKey,
    targetProgramId,
    functionId,
    params
  );
  
  // 세션 키로 서명
  const signedTx = await sessionManager.signWithSessionKey(
    relayTx,
    sessionKey
  );
  
  // 트랜잭션 전송
  const relaySignature = await connection.sendRawTransaction(signedTx.serialize());
  
  console.log(`릴레이 트랜잭션 전송됨: ${relaySignature}`);
  await connection.confirmTransaction(relaySignature);
  
  console.log('예제 완료');
}

main().catch(err => {
  console.error('오류 발생:', err);
}); 