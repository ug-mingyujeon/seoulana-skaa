#!/bin/bash

# 현재 경로 설정
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/.."

# 색상 설정
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

echo -e "${BLUE}===== UXAA 배포 스크립트 =====${NC}"

# 빌드 
echo -e "${YELLOW}Anchor 프로그램 빌드 중...${NC}"
anchor build

# 프로그램 ID 확인
echo -e "${YELLOW}프로그램 ID 확인...${NC}"

# IDL 디렉토리 생성 (없는 경우)
mkdir -p target/idl

# aa_relay 프로그램 ID 추출 및 배포
AA_RELAY_PROGRAM_ID=$(solana address -k target/deploy/aa_relay-keypair.json)
echo -e "${GREEN}AA 중계 프로그램 ID: $AA_RELAY_PROGRAM_ID${NC}"

# user_account 프로그램 ID 추출 및 배포
USER_ACCOUNT_PROGRAM_ID=$(solana address -k target/deploy/user_account-keypair.json)
echo -e "${GREEN}사용자 계정 프로그램 ID: $USER_ACCOUNT_PROGRAM_ID${NC}"

# service 프로그램 ID 추출 및 배포
SERVICE_PROGRAM_ID=$(solana address -k target/deploy/service-keypair.json)
echo -e "${GREEN}서비스 프로그램 ID: $SERVICE_PROGRAM_ID${NC}"

# IDL 파일 복사
cp target/idl/aa_relay.json target/idl/
cp target/idl/user_account.json target/idl/
cp target/idl/service.json target/idl/

# 배포 환경 확인
echo -e "${YELLOW}어떤 환경에 배포하시겠습니까?${NC}"
echo "1) Localnet (기본값)"
echo "2) Devnet"
echo "3) Mainnet"
read -p "선택 (1-3): " ENV_CHOICE

if [ -z "$ENV_CHOICE" ] || [ "$ENV_CHOICE" == "1" ]; then
  CLUSTER="localnet"
  CLUSTER_URL="http://localhost:8899"
elif [ "$ENV_CHOICE" == "2" ]; then
  CLUSTER="devnet"
  CLUSTER_URL="https://api.devnet.solana.com"
elif [ "$ENV_CHOICE" == "3" ]; then
  CLUSTER="mainnet"
  CLUSTER_URL="https://api.mainnet-beta.solana.com"
else
  echo -e "${RED}잘못된 선택입니다. Localnet으로 기본 설정됩니다.${NC}"
  CLUSTER="localnet"
  CLUSTER_URL="http://localhost:8899"
fi

echo -e "${YELLOW}${CLUSTER}에 배포 중...${NC}"

# Anchor 배포
anchor deploy --provider.cluster $CLUSTER

echo -e "${GREEN}배포 완료: $CLUSTER${NC}"

# IDL 업로드 (선택 사항)
if [ "$CLUSTER" != "localnet" ]; then
  read -p "IDL을 체인에 업로드하시겠습니까? (y/n): " UPLOAD_IDL
  if [ "$UPLOAD_IDL" == "y" ] || [ "$UPLOAD_IDL" == "Y" ]; then
    echo -e "${YELLOW}IDL 업로드 중...${NC}"
    anchor idl init --filepath target/idl/aa_relay.json $AA_RELAY_PROGRAM_ID --provider.cluster $CLUSTER
    anchor idl init --filepath target/idl/user_account.json $USER_ACCOUNT_PROGRAM_ID --provider.cluster $CLUSTER
    anchor idl init --filepath target/idl/service.json $SERVICE_PROGRAM_ID --provider.cluster $CLUSTER
    echo -e "${GREEN}IDL 업로드 완료${NC}"
  fi
fi

echo -e "${GREEN}배포 프로세스 완료!${NC}" 