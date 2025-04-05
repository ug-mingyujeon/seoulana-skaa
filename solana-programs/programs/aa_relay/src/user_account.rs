use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;
use anchor_lang::solana_program::instruction::AccountMeta;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UserAccountProgram {
    pub dummy: u8,
}

impl anchor_lang::ToAccountMetas for UserAccountProgram {
    fn to_account_metas(&self, _is_signer: Option<bool>) -> Vec<AccountMeta> {
        vec![]
    }
}

#[derive(Clone)]
pub struct UserAccount;

impl anchor_lang::Id for UserAccount {
    fn id() -> Pubkey {
        // 유저 계정 프로그램 ID (배포 시 수정 필요)
        "HmbTLCmaGvZhKnn1Zfa1JVnp7vkMV4DYVxPLWBVoN65L".parse::<Pubkey>().unwrap()
    }
} 