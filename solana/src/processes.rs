use solana_program::program::{invoke_signed, invoke};
use solana_program::{program_error::ProgramError, pubkey::Pubkey};
use solana_program::account_info::{AccountInfo, next_account_info};
use solana_program::msg;
use spl_associated_token_account::get_associated_token_address;
use spl_associated_token_account::instruction::{create_associated_token_account};
use spl_token::{ error::TokenError, state::{Account as TokenAccount} };
use solana_program::{
    program_pack::Pack,
};
use std::str::FromStr;

const ISC: &str = "C2Jgz6DdupWkdhMpxdZRSy8LL7m9ZFDnUn4tsgPv2H7k";
const OIL: &str = "HXvmV3WGGpAqnehA5ah18b3bpsDApFqXrFvgqVW6dCX3";


pub fn swap_isc_to_oil(program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> Result<(),ProgramError>{
    let accounts_iter = &mut accounts.iter();
    let acc_info_initializer = next_account_info(accounts_iter)?;
    let acc_info_initializer_isc_ata = next_account_info(accounts_iter)?;
    let acc_info_initializer_oil_ata = next_account_info(accounts_iter)?;
    let acc_info_program = next_account_info(accounts_iter)?;
    let acc_info_pda = next_account_info(accounts_iter)?;
    let acc_info_pda_isc_ata = next_account_info(accounts_iter)?;
    let acc_info_pda_oil_ata = next_account_info(accounts_iter)?;
    let acc_info_isc = next_account_info(accounts_iter)?;
    let acc_info_oil = next_account_info(accounts_iter)?;
    let acc_info_token_prog = next_account_info(accounts_iter)?;
    let acc_info_assoc_token_prog = next_account_info(accounts_iter)?;
    let acc_info_sys_prog = next_account_info(accounts_iter)?;

    let isc_pubkey = Pubkey::from_str(ISC).unwrap();
    let oil_pubkey = Pubkey::from_str(OIL).unwrap();

    msg!("Parsed all accounts");

    // Account validations
    if !acc_info_initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature)
    }

    let user_isc_account = TokenAccount::unpack_from_slice(&acc_info_initializer_isc_ata.try_borrow_data()?)?;
    if user_isc_account.owner != *acc_info_initializer.key {
        return Err(TokenError::OwnerMismatch.into())
    }
    if user_isc_account.mint != isc_pubkey {
        return Err(TokenError::OwnerMismatch.into())
    }
    if *acc_info_initializer_isc_ata.owner != spl_token::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    let user_oil_account = TokenAccount::unpack_from_slice(&acc_info_initializer_oil_ata.try_borrow_data()?)?;
    if user_oil_account.owner != *acc_info_initializer.key {
        return Err(TokenError::OwnerMismatch.into())
    }
    if user_oil_account.mint != oil_pubkey {
        return Err(TokenError::OwnerMismatch.into())
    }
    if *acc_info_initializer_isc_ata.owner != spl_token::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    if *acc_info_program.key != crate::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    let seed = "oolaa";
    let (pda, bump) = Pubkey::find_program_address(&[seed.as_bytes().as_ref()], program_id);
    if *acc_info_pda.key != pda {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_pda_isc_ata.key != get_associated_token_address(&pda, &isc_pubkey) {
        return Err(ProgramError::InvalidArgument)
    }
    if *acc_info_pda_oil_ata.key != get_associated_token_address(&pda, &oil_pubkey) {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_isc.key != isc_pubkey {
        return Err(ProgramError::InvalidArgument)
    }
    if *acc_info_oil.key != oil_pubkey {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_token_prog.key != spl_token::id() {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_assoc_token_prog.key != spl_associated_token_account::id() {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_sys_prog.key != solana_program::system_program::id() {
        return Err(ProgramError::InvalidArgument)
    }

    // Create ISC Associated Token Account for the PDA if it does not exist
    let pda_isc_ata_lamports = **acc_info_pda_isc_ata.try_borrow_lamports()?;
    if pda_isc_ata_lamports == 0 {
        msg!("ISC ATA for PDA does not exist");
        let ix = create_associated_token_account(
            acc_info_initializer.key,
            acc_info_pda.key,
            acc_info_isc.key,
            acc_info_token_prog.key,
            );
        msg!("Assoc acc create process started");
        let _result = invoke(
            &ix,
            &[acc_info_initializer.clone(),
            acc_info_pda_isc_ata.clone(),
            acc_info_pda.clone(),
            acc_info_isc.clone(),
            acc_info_sys_prog.clone(),
            acc_info_token_prog.clone()],
            )?;
        msg!("Assoc acc create process ended");
    } else {
        msg!("ISC ATA for PDA exists");
    }

    // Create OIL Associated Token Account for the PDA if it does not exist
    let pda_oil_ata_lamports = **acc_info_pda_oil_ata.try_borrow_lamports()?;
    if pda_oil_ata_lamports == 0 {
        msg!("OIL ATA for PDA does not exist");
        let ix = create_associated_token_account(
            acc_info_initializer.key,
            acc_info_pda.key,
            acc_info_oil.key,
            acc_info_token_prog.key,
            );
        msg!("Assoc acc create process started");
        let _result = invoke(
            &ix,
            &[acc_info_initializer.clone(),
            acc_info_pda_oil_ata.clone(),
            acc_info_pda.clone(),
            acc_info_oil.clone(),
            acc_info_sys_prog.clone(),
            acc_info_token_prog.clone()],
            )?;
        msg!("Assoc acc create process ended");
    }

    //   0. `[writable]` The source account.
    //   1. `[writable]` The destination account.
    //   2. `[signer]` The source account's owner/delegate.
    msg!("Swap ISC to Oil instruction started");
    let tx = spl_token::instruction::transfer(
        acc_info_token_prog.key,
        acc_info_initializer_isc_ata.key,
        acc_info_pda_isc_ata.key,
        acc_info_initializer.key,
        &[acc_info_initializer.key],
        amount 
        )?;
    msg!("Swap ISC to Oil instruction ended");
    msg!("Swap ISC to Oil process started");
    let _result = invoke(
        &tx,
        &[acc_info_initializer_isc_ata.clone(), acc_info_pda_isc_ata.clone(), acc_info_initializer.clone()],
        )?;
    msg!("Swap ISC to Oil process ended");

    msg!("Swap OIL to ISC instruction started");
    let tx = spl_token::instruction::transfer(
        acc_info_token_prog.key,
        acc_info_pda_oil_ata.key,
        acc_info_initializer_oil_ata.key,
        acc_info_pda.key,
        &[acc_info_pda.key],
        amount 
        )?;
    msg!("Swap OIL to ISC instruction ended");
    msg!("Swap OIL to ISC process started");
    let _result = invoke_signed(
        &tx,
        &[acc_info_pda_oil_ata.clone(), acc_info_initializer_oil_ata.clone(), acc_info_pda.clone()],
        &[&[seed.as_bytes().as_ref(), &[bump]]]
        )?;
    msg!("Swap OIL to ISC process ended");
    Ok(())
}

pub fn swap_oil_to_isc(program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> Result<(),ProgramError>{
    let accounts_iter = &mut accounts.iter();
    let acc_info_initializer = next_account_info(accounts_iter)?;
    let acc_info_initializer_isc_ata = next_account_info(accounts_iter)?;
    let acc_info_initializer_oil_ata = next_account_info(accounts_iter)?;
    let acc_info_program = next_account_info(accounts_iter)?;
    let acc_info_pda = next_account_info(accounts_iter)?;
    let acc_info_pda_isc_ata = next_account_info(accounts_iter)?;
    let acc_info_pda_oil_ata = next_account_info(accounts_iter)?;
    let acc_info_isc = next_account_info(accounts_iter)?;
    let acc_info_oil = next_account_info(accounts_iter)?;
    let acc_info_token_prog = next_account_info(accounts_iter)?;
    let acc_info_assoc_token_prog = next_account_info(accounts_iter)?;
    let acc_info_sys_prog = next_account_info(accounts_iter)?;

    let isc_pubkey = Pubkey::from_str(ISC).unwrap();
    let oil_pubkey = Pubkey::from_str(OIL).unwrap();

    msg!("Parsed all accounts");

    // Account validations
    if !acc_info_initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature)
    }

    let user_isc_account = TokenAccount::unpack_from_slice(&acc_info_initializer_isc_ata.try_borrow_data()?)?;
    if user_isc_account.owner != *acc_info_initializer.key {
        return Err(TokenError::OwnerMismatch.into())
    }
    if user_isc_account.mint != isc_pubkey {
        return Err(TokenError::OwnerMismatch.into())
    }
    if *acc_info_initializer_isc_ata.owner != spl_token::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    let user_oil_account = TokenAccount::unpack_from_slice(&acc_info_initializer_oil_ata.try_borrow_data()?)?;
    if user_oil_account.owner != *acc_info_initializer.key {
        return Err(TokenError::OwnerMismatch.into())
    }
    if user_oil_account.mint != oil_pubkey {
        return Err(TokenError::OwnerMismatch.into())
    }
    if *acc_info_initializer_isc_ata.owner != spl_token::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    if *acc_info_program.key != crate::id() {
        return Err(ProgramError::IncorrectProgramId)
    }

    let seed = "oolaa";
    let (pda, bump) = Pubkey::find_program_address(&[seed.as_bytes().as_ref()], program_id);
    if *acc_info_pda.key != pda {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_pda_isc_ata.key != get_associated_token_address(&pda, &isc_pubkey) {
        return Err(ProgramError::InvalidArgument)
    }
    if *acc_info_pda_oil_ata.key != get_associated_token_address(&pda, &oil_pubkey) {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_isc.key != isc_pubkey {
        return Err(ProgramError::InvalidArgument)
    }
    if *acc_info_oil.key != oil_pubkey {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_token_prog.key != spl_token::id() {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_assoc_token_prog.key != spl_associated_token_account::id() {
        return Err(ProgramError::InvalidArgument)
    }

    if *acc_info_sys_prog.key != solana_program::system_program::id() {
        return Err(ProgramError::InvalidArgument)
    }


    // Create ISC Associated Token Account for the PDA if it does not exist
    let pda_isc_ata_lamports = **acc_info_pda_isc_ata.try_borrow_lamports()?;
    if pda_isc_ata_lamports == 0 {
        msg!("ISC ATA for PDA does not exist");
        let ix = create_associated_token_account(
            acc_info_initializer.key,
            acc_info_pda.key,
            acc_info_isc.key,
            acc_info_token_prog.key,
            );
        msg!("Assoc acc create process started");
        let _result = invoke(
            &ix,
            &[acc_info_initializer.clone(),
            acc_info_pda_isc_ata.clone(),
            acc_info_pda.clone(),
            acc_info_isc.clone(),
            acc_info_sys_prog.clone(),
            acc_info_token_prog.clone()],
            )?;
        msg!("Assoc acc create process ended");
    }

    // Create OIL Associated Token Account for the PDA if it does not exist
    let pda_oil_ata_lamports = **acc_info_pda_oil_ata.try_borrow_lamports()?;
    if pda_oil_ata_lamports == 0 {
        msg!("OIL ATA for PDA does not exist");
        let ix = create_associated_token_account(
            acc_info_initializer.key,
            acc_info_pda.key,
            acc_info_oil.key,
            acc_info_token_prog.key,
            );
        msg!("Assoc acc create process started");
        let _result = invoke(
            &ix,
            &[acc_info_initializer.clone(),
            acc_info_pda_oil_ata.clone(),
            acc_info_pda.clone(),
            acc_info_oil.clone(),
            acc_info_sys_prog.clone(),
            acc_info_token_prog.clone()],
            )?;
        msg!("Assoc acc create process ended");
    }

    //   0. `[writable]` The source account.
    //   1. `[writable]` The destination account.
    //   2. `[signer]` The source account's owner/delegate.
    msg!("Swap OIL user to PDA instruction started");
    let tx = spl_token::instruction::transfer(
        acc_info_token_prog.key,
        acc_info_initializer_oil_ata.key,
        acc_info_pda_oil_ata.key,
        acc_info_initializer.key,
        &[acc_info_initializer.key],
        amount 
        )?;
    msg!("Swap OIL user to PDA instruction ended");
    msg!("Swap OIL user to PDA process started");
    let _result = invoke(
        &tx,
        &[acc_info_initializer_oil_ata.clone(), acc_info_pda_oil_ata.clone(), acc_info_initializer.clone()],
        )?;
    msg!("Swap OIL user to PDA process ended");

    msg!("Swap ISC user to PDA instruction started");
    let tx = spl_token::instruction::transfer(
        acc_info_token_prog.key,
        acc_info_pda_isc_ata.key,
        acc_info_initializer_isc_ata.key,
        acc_info_pda.key,
        &[acc_info_pda.key],
        amount 
        )?;
    msg!("Swap ISC user to PDA instruction ended");
    msg!("Swap ISC user to PDA process started");
    let _result = invoke_signed(
        &tx,
        &[acc_info_pda_isc_ata.clone(), acc_info_initializer_isc_ata.clone(), acc_info_pda.clone()],
        &[&[seed.as_bytes().as_ref(), &[bump]]]
        )?;
    msg!("Swap ISC user to PDA process ended");
    Ok(())
}
