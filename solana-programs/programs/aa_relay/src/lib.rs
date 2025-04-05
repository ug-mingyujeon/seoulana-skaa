use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::system_program;

// 유저 계정 프로그램 IDL
pub mod user_account {
    use super::*;
    
    #[derive(Clone)]
    pub struct UserAccount;
    
    impl anchor_lang::Id for UserAccount {
        fn id() -> Pubkey {
            // 유저 계정 프로그램 ID (배포 시 수정 필요)
            "G6p3b6vh9YcXrwKrGzkmHxh9ynDVvCbx2ShRGamofrL4".parse::<Pubkey>().unwrap()
        }
    }
    
    #[derive(Clone, AnchorSerialize, AnchorDeserialize)]
    pub struct UserAccountProgram { pub dummy: u8 }
    
    impl anchor_lang::ToAccountMetas for UserAccountProgram {
        fn to_account_metas(&self, _is_signer: Option<bool>) -> Vec<AccountMeta> {
            vec![]
        }
    }

}

declare_id!("Dv9qDFdwsHpzcNZ7KxJgChV7yzAnMjTFDYp5JGCkzKvL");

#[program]
pub mod aa_relay {
    use super::*;
    
    /// 수수료 정책 설정 함수
    /// 
    /// * `fee_collector` - 수수료를 수령하는 계정
    /// * `sol_fee_bps` - SOL 전송에 대한 수수료율 (basis points, 10000 = 100%)
    /// * `token_fee_bps` - 토큰 전송에 대한 수수료율 (basis points, 10000 = 100%)
    /// * `min_fee_amount` - 최소 수수료 금액 (lamports)
    pub fn set_fee_policy(
        ctx: Context<SetFeePolicy>,
        sol_fee_bps: u16,
        token_fee_bps: u16,
        min_fee_amount: u64,
    ) -> Result<()> {
        let fee_policy = &mut ctx.accounts.fee_policy;
        
        // 수수료율 제한 (최대 20%)
        require!(sol_fee_bps <= 2000, ErrorCode::FeeTooHigh);
        require!(token_fee_bps <= 2000, ErrorCode::FeeTooHigh);
        
        fee_policy.fee_collector = ctx.accounts.fee_collector.key();
        fee_policy.sol_fee_bps = sol_fee_bps;
        fee_policy.token_fee_bps = token_fee_bps;
        fee_policy.min_fee_amount = min_fee_amount;
        fee_policy.authority = ctx.accounts.authority.key();
        
        msg!("수수료 정책이 설정되었습니다. SOL: {}bps, 토큰: {}bps, 최소: {} lamports",
            sol_fee_bps, token_fee_bps, min_fee_amount);
        Ok(())
    }

    /// 토큰별 수수료 정책 설정 함수
    /// 
    /// * `token_mint` - 토큰 Mint 주소
    /// * `fee_bps` - 해당 토큰에 대한 수수료율 (basis points, 10000 = 100%)
    pub fn set_token_fee_policy(
        ctx: Context<SetTokenFeePolicy>,
        fee_bps: u16,
    ) -> Result<()> {
        let token_fee_policy = &mut ctx.accounts.token_fee_policy;
        
        // 수수료율 제한 (최대 20%)
        require!(fee_bps <= 2000, ErrorCode::FeeTooHigh);
        
        token_fee_policy.token_mint = ctx.accounts.token_mint.key();
        token_fee_policy.fee_bps = fee_bps;
        
        msg!("토큰 수수료 정책이 설정되었습니다. 토큰: {}, 수수료율: {}bps",
            ctx.accounts.token_mint.key(), fee_bps);
        Ok(())
    }
    
    /// 보안 정책 설정 함수
    /// 
    /// * `max_tx_per_day` - 일일 최대 트랜잭션 수
    /// * `max_amount_per_tx` - 트랜잭션당 최대 금액
    /// * `max_amount_per_day` - 일일 최대 금액
    pub fn set_security_policy(
        ctx: Context<SetSecurityPolicy>,
        max_tx_per_day: u32,
        max_amount_per_tx: u64,
        max_amount_per_day: u64,
        allowed_functions: Vec<u8>,
    ) -> Result<()> {
        let security_policy = &mut ctx.accounts.security_policy;
        
        security_policy.user_id = ctx.accounts.key_mapping.user_id.clone();
        security_policy.max_tx_per_day = max_tx_per_day;
        security_policy.max_amount_per_tx = max_amount_per_tx;
        security_policy.max_amount_per_day = max_amount_per_day;
        security_policy.daily_tx_count = 0;
        security_policy.daily_amount = 0;
        security_policy.last_day = Clock::get()?.unix_timestamp / 86400;
        security_policy.allowed_functions = allowed_functions;
        
        msg!("보안 정책이 설정되었습니다. 사용자 ID: {}, 일일 최대 트랜잭션: {}, 트랜잭션당 최대 금액: {}",
            security_policy.user_id, max_tx_per_day, max_amount_per_tx);
        Ok(())
    }
    
    /// 임시 키 및 영구 백업 키 등록 함수
    /// 
    /// * `user_id` - 사용자 고유 식별자 (오프체인에서 관리)
    /// * `expires_at` - 임시 키 만료 시간
    pub fn register_temp_keys(
        ctx: Context<RegisterTempKeys>,
        user_id: String,
        expires_at: i64,
    ) -> Result<()> {
        let key_mapping = &mut ctx.accounts.key_mapping;
        
        // 키 매핑 정보 저장
        key_mapping.temp_key = ctx.accounts.temp_key.key();
        key_mapping.backup_key = ctx.accounts.backup_key.key();
        key_mapping.user_id = user_id.clone();
        key_mapping.expires_at = expires_at;
        key_mapping.revoked = false;
        key_mapping.created_at = Clock::get()?.unix_timestamp;
        
        // 사용자 계정 PDA 계산 (추후 트랜잭션 릴레이에서 사용)
        let (user_account_pda, _) = Pubkey::find_program_address(
            &[b"user_account", user_id.as_bytes()],
            &user_account::UserAccount::id(),
        );
        key_mapping.user_account_pda = user_account_pda;
        
        msg!("임시 키와 영구 백업 키가 등록되었습니다. 임시 키: {}, 백업 키: {}, 사용자 ID: {}", 
            ctx.accounts.temp_key.key(), ctx.accounts.backup_key.key(), user_id);
        Ok(())
    }
    
    /// 임시 키 철회 함수
    pub fn revoke_temp_key(ctx: Context<RevokeTempKey>) -> Result<()> {
        let key_mapping = &mut ctx.accounts.key_mapping;
        
        // 이미 철회된 키인지 확인
        require!(!key_mapping.revoked, ErrorCode::AlreadyRevoked);
        
        // 권한 검증 (관리자만 철회 가능)
        require!(
            ctx.accounts.authority.key() == ctx.accounts.payer.key(),
            ErrorCode::Unauthorized
        );
        
        // 임시 키 철회
        key_mapping.revoked = true;
        
        msg!("임시 키가 철회되었습니다: {}", key_mapping.temp_key);
        Ok(())
    }

    /// 백업 키 변경 함수 (백업 키 소유자만 변경 가능)
    pub fn change_backup_key(ctx: Context<ChangeBackupKey>) -> Result<()> {
        let key_mapping = &mut ctx.accounts.key_mapping;
        
        // 백업 키 소유자 검증 (현재 백업 키 소유자만 변경 가능)
        require!(
            ctx.accounts.current_backup_key_signer.key() == key_mapping.backup_key,
            ErrorCode::Unauthorized
        );
        
        // 백업 키 변경
        key_mapping.backup_key = ctx.accounts.new_backup_key.key();
        
        msg!("백업 키가 변경되었습니다. 이전: {}, 새로운: {}", 
            ctx.accounts.current_backup_key_signer.key(), ctx.accounts.new_backup_key.key());
        Ok(())
    }
    
    /// SPL 토큰 전송 함수
    pub fn transfer_spl_token(
        ctx: Context<TransferSplToken>,
        amount: u64,
    ) -> Result<()> {
        let key_mapping = &ctx.accounts.key_mapping;
        let current_time = Clock::get()?.unix_timestamp;
        let temp_key = ctx.accounts.temp_key.key();
        
        // 서명자가 주 임시 키인지 백업 키인지 확인
        let is_main_key = temp_key == key_mapping.temp_key;
        let is_backup_key = temp_key == key_mapping.backup_key;
        
        require!(
            is_main_key || is_backup_key,
            ErrorCode::InvalidKeySigner
        );
        
        // 임시 키인 경우 만료 시간 확인
        if is_main_key {
            require!(
                current_time < key_mapping.expires_at,
                ErrorCode::SessionExpired
            );
        }
        
        // 보안 정책 검증
        if let Some(security_policy) = &mut ctx.accounts.security_policy {
            // 일자가 바뀌었는지 체크 (단일 비교로 효율화)
            let current_day = current_time / 86400;
            
            if security_policy.last_day != current_day {
                security_policy.daily_tx_count = 0;
                security_policy.daily_amount = 0;
                security_policy.last_day = current_day;
            } else {
                // 트랜잭션 수 제한 확인
                if security_policy.daily_tx_count >= security_policy.max_tx_per_day {
                    return Err(ErrorCode::DailyTxLimitExceeded.into());
                }
                
                // 함수 ID 허용 확인 (간소화된 체크)
                if !security_policy.allowed_functions.is_empty() && 
                   !security_policy.allowed_functions.contains(&2) { // 2: transfer_spl_token 함수 ID
                    return Err(ErrorCode::FunctionNotAllowed.into());
                }
            }
            
            // 트랜잭션 카운트 증가 (한 번만 업데이트)
            security_policy.daily_tx_count += 1;
        }
        
        // 수수료 계산
        let mut fee_amount = 0;
        
        if ctx.accounts.fee_policy.is_some() && ctx.accounts.token_fee_policy.is_some() {
            let fee_policy = ctx.accounts.fee_policy.as_ref().unwrap();
            let token_fee_policy = ctx.accounts.token_fee_policy.as_ref().unwrap();
            
            // 토큰별 수수료율 또는 기본 토큰 수수료율 적용
            let fee_bps = if token_fee_policy.token_mint == ctx.accounts.mint.key() {
                token_fee_policy.fee_bps
            } else {
                fee_policy.token_fee_bps
            };
            
            // 수수료 계산 (basis points)
            fee_amount = (amount as u128 * fee_bps as u128 / 10000) as u64;
            
            // 최소 수수료 적용
            if fee_amount < fee_policy.min_fee_amount {
                fee_amount = fee_policy.min_fee_amount;
            }
            
            // 수수료가 전송 금액보다 크면 오류
            require!(
                fee_amount < amount,
                ErrorCode::FeeTooHigh
            );
            
            msg!("수수료 정보: 금액 = {}, 수수료 = {}, 수신자 수령액 = {}", 
                amount, fee_amount, amount - fee_amount);
            
            // 수수료 전송 (수수료가 있는 경우)
            if fee_amount > 0 {
                // 토큰 계정에서 수수료 수령자에게 수수료 전송
                let cpi_accounts = Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.fee_collector.to_account_info(),
                    authority: ctx.accounts.temp_key.to_account_info(),
                };
                
                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                
                token::transfer(cpi_ctx, fee_amount)?;
            }
        }
        
        // 토큰 전송 (수수료를 제외한 금액)
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.temp_key.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount - fee_amount)?;
        
        msg!("SPL 토큰 전송이 완료되었습니다. 수신자: {}, 금액: {}", 
            ctx.accounts.to.key(), amount - fee_amount);
        Ok(())
    }
    
    /// 트랜잭션 릴레이 함수
    /// 임시 키나 백업 키를 사용하여 유저 계정 프로그램 호출
    pub fn relay_transaction(
        ctx: Context<RelayTransaction>,
        function_id: u8,
        params: Vec<u8>,
    ) -> Result<()> {
        let key_mapping = &mut ctx.accounts.key_mapping;
        let current_time = Clock::get()?.unix_timestamp;
        let temp_key = ctx.accounts.temp_key.key();
        
        // 1. 철회 상태 먼저 검사 (단락 평가 최적화)
        if key_mapping.revoked {
            return Err(ErrorCode::RevokedKey.into());
        }
        
        // 2. 서명 검사 - 메인키 또는 백업키인지 먼저 확인
        let is_main_key = temp_key == key_mapping.temp_key;
        let is_backup_key = temp_key == key_mapping.backup_key;
        
        if !is_main_key && !is_backup_key {
            return Err(ErrorCode::InvalidKeySigner.into());
        }
        
        // 3. 만료 시간 검증 (메인 키인 경우만)
        if is_main_key && current_time >= key_mapping.expires_at {
            return Err(ErrorCode::ExpiredKey.into());
        }
        
        // 4. 보안 정책 검증 (있는 경우만)
        if let Some(security_policy) = &mut ctx.accounts.security_policy {
            // 일자가 바뀌었는지 체크 (단일 비교로 효율화)
            let current_day = current_time / 86400;
            
            if security_policy.last_day != current_day {
                security_policy.daily_tx_count = 0;
                security_policy.daily_amount = 0;
                security_policy.last_day = current_day;
            } else {
                // 트랜잭션 수 제한 확인
                if security_policy.daily_tx_count >= security_policy.max_tx_per_day {
                    return Err(ErrorCode::DailyTxLimitExceeded.into());
                }
                
                // 함수 ID 허용 확인 (간소화된 체크)
                if !security_policy.allowed_functions.is_empty() && 
                   !security_policy.allowed_functions.contains(&function_id) {
                    return Err(ErrorCode::FunctionNotAllowed.into());
                }
            }
            
            // 트랜잭션 카운트 증가 (한 번만 업데이트)
            security_policy.daily_tx_count += 1;
        }
        
        // 5. 사용자 계정 CPI 호출 준비 (효율적인 CPI 생성)
        // 모든 검증이 끝난 후 한 번만 CPI 호출 수행
        let user_account_program = user_account::UserAccount::id();
        let accounts = vec![
            AccountMeta::new_readonly(ctx.accounts.temp_key.key(), true),
            AccountMeta::new_readonly(user_account_program, false),
            AccountMeta::new(key_mapping.user_account_pda, false),
        ];
        
        // 데이터 필드 효율화 (함수 ID + 파라미터)
        let mut data = vec![0u8, function_id];
        data.extend_from_slice(&(params.len() as u32).to_le_bytes());
        data.extend_from_slice(&params);
        
        // 단일 invoke 호출로 최적화
        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: user_account_program,
            accounts,
            data,
        };
        
        invoke(
            &ix,
            &[
                ctx.accounts.temp_key.to_account_info(),
            ],
        )?;
        
        msg!("릴레이 트랜잭션 성공: 함수 ID {}", function_id);
        Ok(())
    }
}

/// 임시 키 매핑 데이터 구조체
#[account]
pub struct KeyMapping {
    /// 임시 키
    pub temp_key: Pubkey,
    /// 백업 키 (영구적)
    pub backup_key: Pubkey,
    /// 사용자 ID
    pub user_id: String,
    /// 사용자 계정 PDA
    pub user_account_pda: Pubkey,
    /// 임시 키 만료 시간
    pub expires_at: i64,
    /// 철회 여부
    pub revoked: bool,
    /// 생성 시간
    pub created_at: i64,
}

/// 수수료 정책 데이터 구조체
#[account]
pub struct FeePolicy {
    /// 수수료 수금자
    pub fee_collector: Pubkey,
    /// SOL 전송에 대한 수수료율 (basis points, 10000 = 100%)
    pub sol_fee_bps: u16,
    /// 토큰 전송에 대한 수수료율 (basis points, 10000 = 100%)
    pub token_fee_bps: u16,
    /// 최소 수수료 금액 (lamports)
    pub min_fee_amount: u64,
    /// 수수료 정책 관리자
    pub authority: Pubkey,
}

/// 토큰별 수수료 정책 데이터 구조체
#[account]
pub struct TokenFeePolicy {
    /// 토큰 Mint 주소
    pub token_mint: Pubkey,
    /// 해당 토큰에 대한 수수료율 (basis points, 10000 = 100%)
    pub fee_bps: u16,
}

/// 보안 정책 데이터 구조체
#[account]
pub struct SecurityPolicy {
    /// 사용자 ID
    pub user_id: String,
    /// 일일 최대 트랜잭션 수
    pub max_tx_per_day: u32,
    /// 트랜잭션당 최대 금액
    pub max_amount_per_tx: u64,
    /// 일일 최대 금액
    pub max_amount_per_day: u64,
    /// 현재 일일 트랜잭션 카운트
    pub daily_tx_count: u32,
    /// 현재 일일 누적 금액
    pub daily_amount: u64,
    /// 마지막 일자 (unix timestamp / 86400)
    pub last_day: i64,
    /// 허용된 함수 ID 목록
    pub allowed_functions: Vec<u8>,
}

/// 수수료 정책 설정 명령어 계정 구조체
#[derive(Accounts)]
pub struct SetFeePolicy<'info> {
    /// 권한 있는 사용자 (관리자)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// 수수료 수금자 계정
    /// CHECK: 수수료를 받을 계정
    pub fee_collector: AccountInfo<'info>,
    
    /// 수수료 정책 데이터
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"fee_policy"],
        bump,
        space = 8 + 32 + 2 + 2 + 8 + 32
    )]
    pub fee_policy: Account<'info, FeePolicy>,
    
    /// 시스템 프로그램
    pub system_program: Program<'info, System>,
}

/// 토큰별 수수료 정책 설정 명령어 계정 구조체
#[derive(Accounts)]
pub struct SetTokenFeePolicy<'info> {
    /// 권한 있는 사용자 (관리자)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// 토큰 Mint 주소
    /// CHECK: 토큰 민트는 단순 식별자로만 사용됩니다
    pub token_mint: AccountInfo<'info>,
    
    /// 토큰별 수수료 정책 데이터
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"token_fee_policy", token_mint.key().as_ref()],
        bump,
        space = 8 + 32 + 2
    )]
    pub token_fee_policy: Account<'info, TokenFeePolicy>,
    
    /// 시스템 프로그램
    pub system_program: Program<'info, System>,
}

/// 보안 정책 설정 명령어 계정 구조체
#[derive(Accounts)]
pub struct SetSecurityPolicy<'info> {
    /// 권한 있는 사용자 (관리자)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// 임시 키 매핑 데이터
    pub key_mapping: Account<'info, KeyMapping>,
    
    /// 보안 정책 데이터
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"security_policy", key_mapping.user_id.as_bytes()],
        bump,
        space = 8 + 4 + key_mapping.user_id.len() + 4 + 8 + 8 + 4 + 8 + 8 + 4 + 10 * 1 // 최대 10개의 함수 ID 허용
    )]
    pub security_policy: Account<'info, SecurityPolicy>,
    
    /// 시스템 프로그램
    pub system_program: Program<'info, System>,
}

/// 임시 키 및 백업 키 등록 명령어 계정 구조체
#[derive(Accounts)]
#[instruction(user_id: String, expires_at: i64)]
pub struct RegisterTempKeys<'info> {
    /// 트랜잭션 지불자 (관리자)
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// 임시 키 계정
    /// CHECK: 임시 키는 서명 검증이 필요 없음, 단순 식별자로 사용
    pub temp_key: AccountInfo<'info>,
    
    /// 백업 키 계정
    /// CHECK: 백업 키는 서명 검증이 필요 없음, 단순 식별자로 사용
    pub backup_key: AccountInfo<'info>,
    
    /// 임시 키 매핑 데이터
    #[account(
        init,
        payer = payer,
        seeds = [
            b"key_mapping",
            temp_key.key().as_ref(),
        ],
        bump,
        // 정확한 공간 계산
        space = 8 + // 디스크리미네이터
               32 + // temp_key: Pubkey
               32 + // backup_key: Pubkey
               4 + user_id.len() + // user_id: String (길이 헤더 + 데이터)
               32 + // user_account_pda: Pubkey
               8 +  // expires_at: i64
               1 +  // revoked: bool
               8    // created_at: i64
    )]
    pub key_mapping: Account<'info, KeyMapping>,
    
    /// 시스템 프로그램
    pub system_program: Program<'info, System>,
}

/// 임시 키 철회 명령어 계정 구조체
#[derive(Accounts)]
pub struct RevokeTempKey<'info> {
    /// 권한 있는 사용자 (관리자)
    pub authority: Signer<'info>,
    
    /// 트랜잭션 지불자 (관리자)
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// 임시 키 매핑 데이터
    #[account(
        mut,
        seeds = [
            b"key_mapping",
            key_mapping.temp_key.as_ref(),
        ],
        bump,
    )]
    pub key_mapping: Account<'info, KeyMapping>,
}

/// 백업 키 변경 명령어 계정 구조체
#[derive(Accounts)]
pub struct ChangeBackupKey<'info> {
    /// 현재 백업 키 서명자 (현재 백업 키의 소유자)
    pub current_backup_key_signer: Signer<'info>,
    
    /// 새로운 백업 키 계정
    /// CHECK: 백업 키는 서명 검증이 필요 없음, 단순 식별자로 사용
    pub new_backup_key: AccountInfo<'info>,
    
    /// 임시 키 매핑 데이터
    #[account(
        mut,
        seeds = [
            b"key_mapping",
            key_mapping.temp_key.as_ref(),
        ],
        bump,
    )]
    pub key_mapping: Account<'info, KeyMapping>,
}

/// SPL 토큰 전송 명령어 계정 구조체
#[derive(Accounts)]
pub struct TransferSplToken<'info> {
    /// 수수료 지불자 (관리자 또는 서비스 제공자)
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    
    /// 임시 키 또는 백업 키 서명자
    #[account(mut)]
    pub temp_key: Signer<'info>,
    
    /// 토큰 Mint 주소
    /// CHECK: 토큰 민트는 단순 식별자로만 사용됩니다
    pub mint: AccountInfo<'info>,
    
    /// 송신자 토큰 계정
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    /// 수신자 토큰 계정
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    /// 수수료 수금자 토큰 계정
    #[account(mut)]
    pub fee_collector: Account<'info, TokenAccount>,
    
    /// 임시 키 매핑 데이터
    #[account(
        seeds = [b"key_mapping", temp_key.key().as_ref()],
        bump
    )]
    pub key_mapping: Account<'info, KeyMapping>,
    
    /// 수수료 정책 (선택적)
    #[account(
        seeds = [b"fee_policy"],
        bump,
    )]
    pub fee_policy: Option<Account<'info, FeePolicy>>,
    
    /// 토큰별 수수료 정책 (선택적)
    #[account(
        seeds = [b"token_fee_policy", mint.key().as_ref()],
        bump,
    )]
    pub token_fee_policy: Option<Account<'info, TokenFeePolicy>>,
    
    /// 보안 정책 (선택적)
    #[account(
        mut,
        seeds = [b"security_policy", key_mapping.user_id.as_bytes()],
        bump,
        constraint = if security_policy.to_account_info().owner == &system_program::ID {
            true
        } else {
            security_policy.user_id == key_mapping.user_id
        }
    )]
    pub security_policy: Option<Account<'info, SecurityPolicy>>,
    
    /// 토큰 프로그램
    pub token_program: Program<'info, Token>,
}

/// 트랜잭션 릴레이 명령어 계정 구조체
#[derive(Accounts)]
pub struct RelayTransaction<'info> {
    /// 수수료 지불자 (관리자 또는 서비스 제공자)
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    
    /// 임시 키 또는 백업 키 서명자
    #[account(mut)]
    pub temp_key: Signer<'info>,
    
    /// AA 릴레이 프로그램 ID
    /// CHECK: 프로그램 ID는 유저 계정에 저장된 값과 일치하는지 확인하는 용도로만 사용
    
    /// 임시 키 매핑 데이터
    #[account(
        mut,
        seeds = [b"key_mapping", temp_key.key().as_ref()],
        bump
    )]
    pub key_mapping: Account<'info, KeyMapping>,
    
    /// 보안 정책 (선택적)
    #[account(
        mut,
        seeds = [b"security_policy", key_mapping.user_id.as_bytes()],
        bump,
        constraint = if security_policy.to_account_info().owner == &system_program::ID {
            true
        } else {
            security_policy.user_id == key_mapping.user_id
        }
    )]
    pub security_policy: Option<Account<'info, SecurityPolicy>>,
    
    /// 시스템 프로그램 (수수료 처리용)
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("권한이 없습니다")]
    Unauthorized,
    
    #[msg("세션이 만료되었습니다")]
    SessionExpired,
    
    #[msg("세션이 철회되었습니다")]
    SessionRevoked,
    
    #[msg("이미 철회된 키입니다")]
    AlreadyRevoked,
    
    #[msg("유효하지 않은 키 서명자입니다")]
    InvalidKeySigner,
    
    #[msg("권한이 없는 키 서명자입니다")]
    UnauthorizedKeySigner,
    
    #[msg("철회된 키입니다")]
    RevokedKey,
    
    #[msg("만료된 키입니다")]
    ExpiredKey,
    
    #[msg("수수료가 너무 높습니다")]
    FeeTooHigh,
    
    #[msg("일일 트랜잭션 한도를 초과했습니다")]
    DailyTxLimitExceeded,
    
    #[msg("트랜잭션 금액 한도를 초과했습니다")]
    TxAmountLimitExceeded,
    
    #[msg("일일 금액 한도를 초과했습니다")]
    DailyAmountLimitExceeded,
    
    #[msg("허용되지 않은 함수입니다")]
    FunctionNotAllowed,
}
