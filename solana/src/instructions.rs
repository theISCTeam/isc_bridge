use borsh::BorshDeserialize;
use solana_program::program_error::ProgramError;

pub enum SwapInstruction {
    SwapIscToOil {amount:u64},
    SwapOilToIsc {amount:u64},
}

#[derive(BorshDeserialize)]
struct SwapPayload {
    amount: u64,
}

impl  SwapInstruction {
    pub fn unpack(input: &[u8]) -> Result<SwapInstruction, ProgramError> {
        let (&variant, payload) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        let payload = SwapPayload::try_from_slice(payload).unwrap();
        Ok(match variant {
            0 => Self::SwapIscToOil { amount: payload.amount },
            1 => Self::SwapOilToIsc { amount: payload.amount },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}
