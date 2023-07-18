pub mod instructions;
pub mod processes;

use instructions::SwapInstruction;
use solana_program::entrypoint;
use solana_program::entrypoint::ProgramResult;
use solana_program::account_info::AccountInfo;
use solana_program::msg;
use solana_program::pubkey::Pubkey;

entrypoint!(my_function);



pub fn my_function(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let instruction_variant = SwapInstruction::unpack(data)?;
    match instruction_variant {
        SwapInstruction::SwapIscToOil { amount } => {
            processes::swap_isc_to_oil(program_id, accounts, amount)?;
            msg!("Swapped {} ISC to OIL", amount);
        },
        SwapInstruction::SwapOilToIsc { amount } => {
            processes::swap_oil_to_isc(program_id, accounts, amount)?;
            msg!("Swapped {} OIL to ISC", amount);
        },
    }
    Ok(())
}

solana_program::declare_id!("7JAUAovyJHXsvqJkeXmjiTUpWTBADiFPagmkgj2Y2s47");