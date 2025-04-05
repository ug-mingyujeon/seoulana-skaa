import { Keypair, PublicKey, Transaction, Connection } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import * as nacl from 'tweetnacl';

/**
 * 세션 키 관리 클래스
 * 세션 키 생성, 등록, 서명 등의 기능 제공
 */
export class SessionKeyManager {
  private wallet: anchor.Wallet;
  private provider: anchor.Provider;
  private connection: Connection;

  constructor(wallet: anchor.Wallet, connection?: Connection) {
    this.wallet = wallet;
    this.connection = connection || new Connection('https://api.devnet.solana.com', 'confirmed');
    this.provider = new anchor.AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );
  }

  /**
   * 새 세션 키 생성
   * @returns 생성된 세션 키 (Keypair)
   */
  public createSessionKey(): Keypair {
    return Keypair.generate();
  }

  /**
   * 세션 키 등록 트랜잭션 생성
   * @param program AA 릴레이 프로그램
   * @param sessionKey 세션 키
   * @param expiresAt 만료 시간 (초)
   * @returns 등록 트랜잭션
   */
  public async createRegisterSessionTransaction(
    program: anchor.Program,
    sessionKey: Keypair, 
    expiresAt: number
  ): Promise<Transaction> {
    const [sessionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('session'),
        this.wallet.publicKey.toBuffer(),
        sessionKey.publicKey.toBuffer()
      ],
      program.programId
    );

    const transaction = await program.methods
      .registerSessionKey(
        sessionKey.publicKey,
        new anchor.BN(expiresAt)
      )
      .accounts({
        userMain: this.wallet.publicKey,
        sessionAccount: sessionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    return transaction;
  }

  /**
   * 세션 키로 트랜잭션 서명
   * @param transaction 서명할 트랜잭션
   * @param sessionKey 사용할 세션 키
   * @returns 서명된 트랜잭션
   */
  public async signWithSessionKey(
    transaction: Transaction,
    sessionKey: Keypair
  ): Promise<Transaction> {
    transaction.feePayer = this.wallet.publicKey;
    
    const blockhash = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash.blockhash;
    
    transaction.sign(sessionKey);
    
    return transaction;
  }

  /**
   * 세션 키로 릴레이 트랜잭션 생성
   * @param program AA 릴레이 프로그램
   * @param sessionKey 세션 키
   * @param targetProgramId 대상 프로그램 ID
   * @param functionId 함수 ID
   * @param params 함수 파라미터
   * @returns 릴레이 트랜잭션
   */
  public async createRelayTransaction(
    program: anchor.Program,
    sessionKey: Keypair,
    targetProgramId: PublicKey,
    functionId: number,
    params: Buffer
  ): Promise<Transaction> {
    const [sessionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('session'),
        this.wallet.publicKey.toBuffer(),
        sessionKey.publicKey.toBuffer()
      ],
      program.programId
    );

    const [userAccountPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user_account'),
        this.wallet.publicKey.toBuffer()
      ],
      program.programId
    );

    const transaction = await program.methods
      .relayTransaction(
        targetProgramId,
        functionId,
        params
      )
      .accounts({
        userMain: this.wallet.publicKey,
        sessionAccount: sessionPda,
        userAccount: userAccountPda,
        sessionSigner: sessionKey.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    return transaction;
  }

  /**
   * 세션 철회 트랜잭션 생성
   * @param program AA 릴레이 프로그램
   * @param sessionKey 철회할 세션 키
   * @returns 철회 트랜잭션
   */
  public async createRevokeSessionTransaction(
    program: anchor.Program,
    sessionKey: Keypair | PublicKey
  ): Promise<Transaction> {
    const sessionPubkey = sessionKey instanceof Keypair 
      ? sessionKey.publicKey 
      : sessionKey;

    const [sessionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('session'),
        this.wallet.publicKey.toBuffer(),
        sessionPubkey.toBuffer()
      ],
      program.programId
    );

    const transaction = await program.methods
      .revokeSession()
      .accounts({
        userMain: this.wallet.publicKey,
        sessionAccount: sessionPda,
      })
      .transaction();

    return transaction;
  }
}
