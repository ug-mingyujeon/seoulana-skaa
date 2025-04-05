use anchor_lang::prelude::*;

declare_id!("B3iHitcqXfADEeDozkuu4KnWs4PqKPFNQhPWRan1v7o9");

#[program]
pub mod uxaa {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
