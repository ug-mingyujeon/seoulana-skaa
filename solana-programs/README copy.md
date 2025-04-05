# UXAA (User eXperience Account Abstraction)

UXAA는 Solana 기반의 "세션키 + 계정 추상화(AA)" 시스템을 구현한 프로젝트입니다. 이 프로젝트는 사용자가 임시 세션 키와 백업 키를 사용하여 트랜잭션을 수행할 수 있도록 하며, 세션 키 관리, 계정 추상화, 그리고 다양한 자산 관리 기능을 제공합니다.

## 주요 기능

### 1. 계정 추상화 시스템
- **임시 키 관리**: 사용자는 임시 세션 키를 생성하고 등록하여 사용할 수 있습니다.
- **영구 백업 키**: 임시 키와 함께 백업 키를 등록하여 임시 키 사용이 불가능한 경우에도 계정에 접근할 수 있습니다.
- **트랜잭션 릴레이**: 임시 키 또는 백업 키로 서명된 트랜잭션을 중계하여 사용자 계정에서 실행합니다.

### 2. SPL 토큰 지원
- **SPL 토큰 전송**: 다양한 SPL 토큰을 안전하게 전송할 수 있습니다.
- **토큰 계정 자동 생성**: 토큰 전송 시 필요한 계정이 자동으로 생성됩니다.
- **토큰 잔액 관리**: 토큰 잔액을 조회하고 관리할 수 있습니다.

### 3. 커스터마이징 가능한 수수료 정책
- **기본 수수료 설정**: SOL 및 토큰 트랜잭션에 대한 기본 수수료율을 설정할 수 있습니다.
- **토큰별 수수료 정책**: 특정 토큰에 대해 다른 수수료율을 적용할 수 있습니다.
- **최소 수수료 금액**: 트랜잭션당 최소 수수료 금액을 설정할 수 있습니다.
- **수수료 계산 및 적용**: 트랜잭션 금액에 따라 수수료를 자동으로 계산하고 적용합니다.

### 4. 보안 정책 커스터마이징
- **일일 트랜잭션 제한**: 사용자별로 일일 최대 트랜잭션 수를 제한할 수 있습니다.
- **트랜잭션 금액 제한**: 트랜잭션당 최대 금액과 일일 총 금액을 제한할 수 있습니다.
- **함수 접근 제어**: 특정 함수 ID에 대한 접근을 제한할 수 있습니다.
- **자동 정책 갱신**: 일일 제한은 자동으로 초기화됩니다.

## 프로젝트 구조

### 프로그램 (On-chain)
1. **AA 릴레이 프로그램**: 임시 키 관리, 트랜잭션 릴레이, 수수료 및 보안 정책 관리
2. **사용자 계정 프로그램**: 사용자 자산 관리, 트랜잭션 실행
3. **서비스 프로그램**: 비즈니스 로직 처리

### SDK (Off-chain)
1. **UXAA_SDK**: 전체 시스템을 관리하는 메인 클래스
2. **TempKeyManager**: 임시 키 및 백업 키 관리
3. **UserAccountManager**: 사용자 계정 및 자산 관리

## 설치 및 사용 방법

### 요구 사항
- Solana CLI
- Node.js와 NPM/Yarn
- Anchor Framework

### 설치
```bash
# 저장소 클론
git clone https://github.com/your-username/uxaa.git
cd uxaa

# 의존성 설치
yarn install

# 프로그램 빌드
anchor build
```

### 테스트
```bash
# 테스트 실행
anchor test
```

### 예제 실행
```bash
# 수수료 및 SPL 토큰 예제 실행
ts-node app/examples/fee-example.ts
```

## 예제 코드

### 임시 키 및 백업 키 등록
```typescript
const tempKeyPair = Keypair.generate();
const backupKeyPair = Keypair.generate();
const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료

const authData = await sdk.registerTempKeys(
  tempKeyPair.publicKey,
  backupKeyPair.publicKey,
  expiresAt
);
```

### 수수료 정책 설정
```typescript
await sdk.setFeePolicy(
  feeCollector,  // 수수료 수금자
  200,           // SOL 수수료율 (2%)
  200,           // 토큰 수수료율 (2%)
  new BN(10000)  // 최소 수수료 금액
);

// 토큰별 수수료 정책
await sdk.setTokenFeePolicy(
  mint,          // 토큰 Mint 주소
  300            // 해당 토큰의 수수료율 (3%)
);
```

### SPL 토큰 전송
```typescript
const transferTx = await sdk.transferSplToken(
  {
    mint,                      // 토큰 Mint 주소
    from: senderTokenAccount,  // 송신자 토큰 계정
    to: receiverTokenAccount,  // 수신자 토큰 계정
    amount: new BN(1000000000) // 전송 금액 (소수점 고려)
  },
  tempKeyPair                  // 임시 키 또는 백업 키
);
```

## 라이센스
MIT 라이센스 