import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * 세션 계정 구조
 */
export interface SessionAccount {
  userMain: PublicKey;
  sessionKey: PublicKey;
  expiresAt: BN;
  isRevoked: boolean;
  nonce: BN;
}

/**
 * 사용자 계정 구조
 */
export interface UserAccount {
  userMain: PublicKey;
  initialized: boolean;
  authorizedPrograms: PublicKey[];
}

/**
 * 세션 상태 타입
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  UNKNOWN = 'unknown'
}

/**
 * 세션 정보 타입
 */
export interface SessionInfo {
  sessionKey: PublicKey;
  userMain: PublicKey;
  expiresAt: BN;
  status: SessionStatus;
  nonce: BN;
}

/**
 * 릴레이 요청 타입
 */
export interface RelayRequest {
  targetProgramId: PublicKey;
  functionId: number;
  params: Buffer;
}
