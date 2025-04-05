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

