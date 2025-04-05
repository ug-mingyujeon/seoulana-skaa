use anchor_lang::prelude::*;

declare_id!("Av2vi5MnJBPtkHcHqkbEBYSuEXAmkMCuneK1g3gTkD7p");

// 함수 ID 상수 정의
pub const FUNCTION_TRANSFER: u8 = 0;
pub const FUNCTION_REGISTER_TOKEN: u8 = 1;
pub const FUNCTION_CREATE_SWAP: u8 = 2;

#[program]
pub mod service {
    use super::*;

    /// 서비스 초기화 함수
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 서비스 상태 초기화
        service_state.admin = ctx.accounts.admin.key();
        service_state.created_at = Clock::get()?.unix_timestamp;
        service_state.is_paused = false;
        service_state.transaction_count = 0;
        service_state.user_account_program = *ctx.accounts.user_account_program.key;
        
        msg!("서비스가 초기화되었습니다. 관리자: {}", service_state.admin);
        Ok(())
    }

    /// 토큰 전송 (함수 ID: 0)
    /// 
    /// * `amount` - 전송할 금액
    /// * `recipient` - 수신자 주소
    pub fn transfer(
        ctx: Context<ProcessTransaction>,
        amount: u64,
        recipient: Pubkey,
    ) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 단락 평가로 검증 최적화
        if service_state.is_paused {
            return Err(ErrorCode::ServicePaused.into());
        }
        
        if ctx.accounts.caller_program.key() != service_state.user_account_program {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // 트랜잭션 카운트 증가 (단일 업데이트)
        service_state.transaction_count = service_state.transaction_count.saturating_add(1);
        
        // 실제 전송 로직 구현 (간소화된 로깅)
        msg!("토큰 전송: {} => {}", amount, recipient);
        
        Ok(())
    }

    /// 토큰 등록 (함수 ID: 1)
    /// 
    /// * `token_mint` - 토큰 민트 주소
    /// * `token_name` - 토큰 이름
    pub fn register_token(
        ctx: Context<ProcessTransaction>,
        token_mint: Pubkey,
        _token_name: String,
    ) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 단락 평가로 검증 최적화
        if service_state.is_paused {
            return Err(ErrorCode::ServicePaused.into());
        }
        
        if ctx.accounts.caller_program.key() != service_state.user_account_program {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // 효율적인 카운터 증가
        service_state.transaction_count = service_state.transaction_count.saturating_add(1);
        
        // 간소화된 로깅
        msg!("토큰 등록: {}", token_mint);
        
        Ok(())
    }

    /// 스왑 생성 (함수 ID: 2)
    /// 
    /// * `token_a` - 토큰 A 민트
    /// * `token_b` - 토큰 B 민트
    /// * `amount_a` - 토큰 A 양
    /// * `amount_b` - 토큰 B 양
    pub fn create_swap(
        ctx: Context<ProcessTransaction>,
        token_a: Pubkey,
        token_b: Pubkey,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 공통 검증 로직 단순화
        if service_state.is_paused {
            return Err(ErrorCode::ServicePaused.into());
        }
        
        if ctx.accounts.caller_program.key() != service_state.user_account_program {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // 효율적인 카운터 증가
        service_state.transaction_count = service_state.transaction_count.saturating_add(1);
        
        // 간소화된 로깅
        msg!("스왑 생성: {} ({}) <-> {} ({})", token_a, amount_a, token_b, amount_b);
        
        Ok(())
    }

    /// 서비스 일시중지/재개 토글
    pub fn toggle_pause(ctx: Context<AdminOnly>) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 관리자만 일시중지/재개 가능
        require!(
            ctx.accounts.admin.key() == service_state.admin,
            ErrorCode::Unauthorized
        );
        
        // 상태 토글
        service_state.is_paused = !service_state.is_paused;
        
        if service_state.is_paused {
            msg!("서비스가 일시중지되었습니다");
        } else {
            msg!("서비스가 재개되었습니다");
        }
        
        Ok(())
    }

    /// 서비스 관리자 변경
    pub fn change_admin(
        ctx: Context<AdminOnly>,
        new_admin: Pubkey,
    ) -> Result<()> {
        let service_state = &mut ctx.accounts.service_state;
        
        // 관리자만 변경 가능
        require!(
            ctx.accounts.admin.key() == service_state.admin,
            ErrorCode::Unauthorized
        );
        
        // 관리자 변경
        service_state.admin = new_admin;
        
        msg!("서비스 관리자가 변경되었습니다. 새 관리자: {}", new_admin);
        Ok(())
    }
}

/// 서비스 상태 데이터 구조체
#[account]
pub struct ServiceState {
    /// 관리자 계정
    pub admin: Pubkey,
    /// 생성 시각(Unix timestamp)
    pub created_at: i64,
    /// 서비스 일시중지 여부
    pub is_paused: bool,
    /// 트랜잭션 실행 횟수
    pub transaction_count: u64,
    /// 인증된 사용자 계정 프로그램
    pub user_account_program: Pubkey,
}

/// 초기화 명령어 계정 구조체
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// 관리자(서명자)
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// 서비스 상태 계정
    #[account(
        init,
        payer = admin,
        space = 8 + // 디스크리미네이터
               32 + // admin: Pubkey
               8 +  // created_at: i64
               1 +  // is_paused: bool
               8 +  // transaction_count: u64
               32   // user_account_program: Pubkey
    )]
    pub service_state: Account<'info, ServiceState>,
    
    /// 사용자 계정 프로그램 ID
    /// CHECK: 이 계정은 서비스 상태에 저장될 사용자 계정 프로그램 ID로만 사용됩니다.
    pub user_account_program: AccountInfo<'info>,
    
    /// 시스템 프로그램
    pub system_program: Program<'info, System>,
}

/// 트랜잭션 처리 명령어 계정 구조체
#[derive(Accounts)]
pub struct ProcessTransaction<'info> {
    /// 임시 키 서명자
    pub temp_key_signer: Signer<'info>,
    
    /// 서비스 상태 계정
    #[account(mut)]
    pub service_state: Account<'info, ServiceState>,
    
    /// 호출자 프로그램 (사용자 계정 프로그램)
    /// CHECK: 이 계정은 호출자 프로그램 ID를 확인하는 용도로만 사용됩니다.
    pub caller_program: AccountInfo<'info>,
    
    /// 사용자 계정 (PDA)
    /// CHECK: 이 계정은 임시 키로 인증된 사용자 계정으로 별도 검증이 필요하지 않습니다.
    pub user_account: AccountInfo<'info>,
    
    /// 임시 키 인증 데이터
    /// CHECK: 이 계정은 AA 중계 컨트랙트에서 이미 검증된 인증 데이터입니다.
    pub auth_data: AccountInfo<'info>,
}

/// 관리자 전용 명령어 계정 구조체
#[derive(Accounts)]
pub struct AdminOnly<'info> {
    /// 관리자(서명자)
    pub admin: Signer<'info>,
    
    /// 서비스 상태 계정
    #[account(mut)]
    pub service_state: Account<'info, ServiceState>,
}

/// 에러 코드
#[error_code]
pub enum ErrorCode {
    #[msg("권한이 없습니다")]
    Unauthorized,
    
    #[msg("서비스가 일시중지 상태입니다")]
    ServicePaused,
}
