# UXAA (User eXperience Account Abstraction) Design for Solana

This document outlines a comprehensive design for implementing User eXperience-focused Account Abstraction (UXAA) on Solana-based decentralized applications (dApps), utilizing session keys for seamless transaction handling. UXAA extends beyond basic session key implementations by prioritizing enhanced user experience (UX).

---

## Table of Contents

1. [Overview and System Architecture](#1-overview-and-system-architecture)
2. [On-chain Implementation (Solana + Anchor)](#2-on-chain-implementation-solana--anchor)
3. [Off-chain Components (TypeScript + Node.js)](#3-off-chain-components-typescript--nodejs)
4. [Session Expiration and Revocation](#4-session-expiration-and-revocation)
5. [Security Considerations](#5-security-considerations)
6. [Performance and Optimization](#6-performance-and-optimization)
7. [Example Code & Summary](#7-example-code--summary)

---

## 1. Overview and System Architecture

### System Diagram

```
[Off-chain]
- User (Main Key, Session Key)
- Backend (Node.js)

[On-chain]
- AA Relay Contract
- User Account Contract
- Service Contract

User → Backend: Generate session key & sign proof
Backend → AA Relay Contract: Register session transaction
User → AA Relay Contract: Submit session-key transaction
AA Relay → User Account Contract: CPI call
User Account → Service Contract: CPI call
```

### Core Components
- **Main Wallet**: Original user wallet, managing session keys.
- **Session Key**: Temporary keys enabling fast, popup-free transactions for enhanced UX.
- **AA Relay Contract**: Manages session keys and transaction routing.
- **User Account Contract**: Intermediary for invoking business logic.
- **Service Contract**: Executes actual business logic.

---

## 2. On-chain Implementation (Solana + Anchor)

### Primary Functions
- Session Registration (`registerSessionKey`)
- Transaction Relay (`relayTransaction`)
- Session Revocation (`revokeSession`)

### PDA Design
- SessionAccount PDA seeds: `["session", user_main_pubkey, session_pubkey]`
- UserAccount PDA seeds: `["user_account", user_main_pubkey]`

---

## 3. Off-chain Components (TypeScript + Node.js)

### Session Key Generation & Registration
- Client: Generates session key and signs with main wallet.
- Server: Verifies signature and registers the session.

### Session Transaction Flow
- Transactions signed with session keys are submitted to the AA Relay Contract.

---

## 4. Session Expiration and Revocation

- On-chain: Checks expiration and revocation status.
- Off-chain: Periodically scans and automatically revokes expired sessions.

---

## 5. Security Considerations

- Preventing key theft: Minimal permissions, short sessions, rapid revocation.
- Replay attack prevention: Nonce validation, blockhash checks.
- Unauthorized access prevention: Signer verification and usage monitoring.

---

## 6. Performance and Optimization

- Simplified PDA structure for efficient session management.
- Optimized compute budget utilization.
- Strategic Fee Payer assignment (service provider or main wallet).

---

## 7. Example Code & Summary

### Anchor Example (Rust)

```rust
use anchor_lang::prelude::*;

declare_id!("FakedProgram1111111111111111111111111111111");

#[program]
mod uxaa_session {
    use super::*;

    pub fn register_session_key(ctx: Context<RegisterSession>, session_pubkey: Pubkey, expires_at: i64) -> Result<()> {
        ctx.accounts.process(session_pubkey, expires_at)
    }

    pub fn relay_transaction(ctx: Context<RelayTransaction>, target_program_id: Pubkey, func_id: u8, params: Vec<u8>) -> Result<()> {
        ctx.accounts.process(target_program_id, func_id, params)
    }

    pub fn revoke_session(ctx: Context<RevokeSession>) -> Result<()> {
        ctx.accounts.process()
    }
}
```

### TypeScript Example

```typescript
import { Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';

const sessionKey = Keypair.generate();

await program.methods.registerSessionKey(
  sessionKey.publicKey,
  expiresAt
).accounts({
  userMain: wallet.publicKey,
}).rpc();
```

---

## Conclusion

Implementing **UXAA (User eXperience Account Abstraction)** on Solana enhances dApp usability by creating a secure, efficient, and highly user-friendly transaction environment.

---

## Demo Execution Method

1. Local Server Execution:
   ```bash
   npx http-server .
   ```

2. Access `http://localhost:8080` in the browser

3. Phantom Wallet Installation Required (https://phantom.app/)

4. Demo Sequence:
   - Wallet Connection
   - Session Key Generation
   - Session Key Registration
   - Session Key Transaction Submission
   - Session Key Revocation

Note: The demo runs on the Solana Devnet.



# UXAA (User eXperience Account Abstraction) 설계 - Solana 기반

본 문서는 Solana 기반 dApp에서 **사용자 경험(UX)을 최적화한 계정 추상화(Account Abstraction)**를 구현하기 위한 온체인/오프체인 구조 및 세션키 기반의 트랜잭션 처리 방안을 제공합니다. 기존의 단순 세션 키 제공 방식을 넘어서 사용자 친화적인 UX를 강조하는 방향으로 확장하였습니다.

---

## 목차

1. [개요 및 시스템 아키텍처](#1-개요-및-시스템-아키텍처)
2. [온체인 구현 (Solana + Anchor)](#2-온체인-구현-solana--anchor)
3. [오프체인 구성 (TypeScript + Node.js)](#3-오프체인-구성-typescript--nodejs)
4. [세션 만료 및 철회 설계](#4-세션-만료-및-철회-설계)
5. [보안 고려사항](#5-보안-고려사항)
6. [성능 및 최적화](#6-성능-및-최적화)
7. [예시 코드 & 요약](#7-예시-코드--요약)

---

## 1. 개요 및 시스템 아키텍처

### 시스템 개념도

```
[Off-chain]
- 사용자(메인 키, 세션 키)
- 백엔드(Node.js)

[On-chain]
- AA 중계 컨트랙트
- 사용자 계정 컨트랙트
- 서비스 컨트랙트

사용자 → 백엔드: 세션키 생성 및 서명 증명
백엔드 → AA 컨트랙트: 세션 등록 트랜잭션
사용자 → AA 컨트랙트: 세션키로 트랜잭션
AA 컨트랙트 → 사용자 계정 컨트랙트: CPI 호출
사용자 계정 컨트랙트 → 서비스 컨트랙트: CPI 호출
```

### 핵심 컴포넌트
- **메인 지갑**: 사용자 원본 키, 세션 관리 최종 권한
- **세션 키**: UX 향상을 위한 팝업 없는 빠른 트랜잭션 지원
- **AA 중계 컨트랙트**: 세션키 관리, 중계 처리
- **사용자 계정 컨트랙트**: 서비스 호출 중계
- **서비스 컨트랙트**: 실제 비즈니스 로직

---

## 2. 온체인 구현 (Solana + Anchor)

### 주요 기능
- 세션 등록 (`registerSessionKey`)
- 트랜잭션 중계 (`relayTransaction`)
- 세션 철회 (`revokeSession`)

### PDA 설계
- SessionAccount PDA 시드: `["session", user_main_pubkey, session_pubkey]`
- UserAccount PDA 시드: `["user_account", user_main_pubkey]`

---

## 3. 오프체인 구성 (TypeScript + Node.js)

### 세션 키 생성 및 등록
- 클라이언트: 세션 키 생성 및 메인 키 서명
- 서버: 서명 검증 후 세션 등록

### 세션 트랜잭션 처리
- 세션 키로 트랜잭션 서명 → AA 중계 컨트랙트로 전송

---

## 4. 세션 만료 및 철회 설계

- 컨트랙트 내부: 만료 및 철회 상태 확인
- 백엔드: 주기적으로 세션 상태 검사 및 자동 철회 처리

---

## 5. 보안 고려사항

- 세션 키 탈취 방지: 권한 최소화, 짧은 세션, 즉시 철회
- 리플레이 공격 방지: nonce 및 블록해시 검사
- 무단 접근 방지: 서명자 검증 및 사용량 제한

---

## 6. 성능 및 최적화

- PDA 구조 간소화 (세션 PDA 관리)
- Compute Budget 최적화
- Fee Payer 설정 (서비스 또는 메인 지갑)

---

## 7. 예시 코드 & 요약

### Anchor 예시 (Rust)

```rust
use anchor_lang::prelude::*;

declare_id!("FakedProgram1111111111111111111111111111111");

#[program]
mod uxaa_session {
    use super::*;

    pub fn register_session_key(ctx: Context<RegisterSession>, session_pubkey: Pubkey, expires_at: i64) -> Result<()> {
        ctx.accounts.process(session_pubkey, expires_at)
    }

    pub fn relay_transaction(ctx: Context<RelayTransaction>, target_program_id: Pubkey, func_id: u8, params: Vec<u8>) -> Result<()> {
        ctx.accounts.process(target_program_id, func_id, params)
    }

    pub fn revoke_session(ctx: Context<RevokeSession>) -> Result<()> {
        ctx.accounts.process()
    }
}
```

### TypeScript 예시

```typescript
import { Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';

const sessionKey = Keypair.generate();

await program.methods.registerSessionKey(
  sessionKey.publicKey,
  expiresAt
).accounts({
  userMain: wallet.publicKey,
}).rpc();
```

---

## 결론

**UXAA (User eXperience Account Abstraction)** 설계를 통해 Solana 기반 dApp에서 UX를 중점으로 한 계정 추상화를 구현하여 사용자 친화적이며 효율적이고 안전한 트랜잭션 환경을 제공합니다.

---

## 데모 실행 방법

1. 로컬 서버 실행:
   ```bash
   npx http-server .
   ```

2. 브라우저에서 `http://localhost:8080` 접속

3. Phantom 지갑 설치 필요 (https://phantom.app/)

4. 데모 순서:
   - 지갑 연결
   - 세션 키 생성
   - 세션 키 등록
   - 세션 키로 트랜잭션 전송
   - 세션 키 철회

참고: 데모는 Solana Devnet에서 실행됩니다.

