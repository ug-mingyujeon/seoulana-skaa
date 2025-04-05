# UXAA SDK (User eXperience Account Abstraction SDK)

솔라나 기반 dApp에서 사용자 경험(UX)을 최적화한 계정 추상화(Account Abstraction)를 위한 클라이언트 SDK입니다.

## 기능

- 세션 키 생성 및 관리
- 세션 기반 트랜잭션 서명
- 계정 추상화 릴레이 트랜잭션 처리

## 설치

```bash
npm install uxaa-sdk
```

## 사용 방법

```typescript
import { SessionKeyManager } from 'uxaa-sdk';

// 세션 키 생성
const sessionKeyManager = new SessionKeyManager(wallet);
const sessionKey = await sessionKeyManager.createSessionKey();

// 세션 키로 트랜잭션 서명
await sessionKeyManager.signWithSessionKey(transaction, sessionKey);
```

## 개발 방법

```bash
# 의존성 설치
npm install

# 테스트 실행
npm test

# 빌드
npm run build
```

## 라이센스

MIT 