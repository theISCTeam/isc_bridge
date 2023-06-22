use anchor_lang::prelude::*;

declare_id!("6zWU7bEZ1BndvfraVqNyHeuyn5Go8HjtYxEk4ZHR1P1k");

#[program]
pub mod bridge {
    use super::*;
    use anchor_spl::token::{self, transfer};

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
