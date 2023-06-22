import {
  Connection,
  Keypair,
} from "@solana/web3.js"
import { ethers } from "ethers"
import {
  attestFromSolana,
  CHAIN_ID_SOLANA,
  CONTRACTS,
  createWrappedOnEth,
  getEmitterAddressSolana,
  parseSequenceFromLogSolana,
  getSignedVAAWithRetry
} from "@certusone/wormhole-sdk"

////// TODO: pass as config
const SOLANA_PRIVATE_KEY = new Uint8Array()
const SOLANA_HOST = ""
const TEST_SOLANA_TOKEN = ""
const WORMHOLE_RPC_HOSTS = [""]
const ETH_NODE_URL = ""
const ETH_PRIVATE_KEY3 = ""
//////

// https://github.com/wormhole-foundation/wormhole/issues/665


export const attestFromSolanaToEth = async (): Promise<void> => {
  // create a keypair for Solana 
  const keypair = Keypair.fromSecretKey(SOLANA_PRIVATE_KEY)
  const payerAddress = keypair.publicKey.toString()
  // attest the test token
  const connection = new Connection(SOLANA_HOST, "confirmed")
  const transaction = await attestFromSolana(
    connection,
    CONTRACTS.DEVNET.solana.core,
    CONTRACTS.DEVNET.solana.token_bridge,
    payerAddress,
    TEST_SOLANA_TOKEN
  )
  // sign, send, and confirm transaction
  transaction.partialSign(keypair)
  const txid = await connection.sendRawTransaction(
    transaction.serialize()
  )
  await connection.confirmTransaction(txid)
  const info = await connection.getTransaction(txid)
  if (!info) {
    throw new Error(
      "An error occurred while fetching the transaction info"
    )
  }
  // get the sequence from the logs (needed to fetch the vaa)
  const sequence = parseSequenceFromLogSolana(info)
  const emitterAddress = await getEmitterAddressSolana(
    CONTRACTS.DEVNET.solana.token_bridge
  )
  // poll until the guardian(s) witness and sign the vaa
  const { vaaBytes: signedVAA } = await getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS,
    CHAIN_ID_SOLANA,
    emitterAddress,
    sequence
  )
  // create a signer for Eth
  const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL)
  const wallet = new ethers.Wallet(ETH_PRIVATE_KEY3, provider)

  try {
    await createWrappedOnEth(
      CONTRACTS.DEVNET.ethereum.token_bridge,
      wallet,
      signedVAA
    )
  } catch (e) {
    // this could fail because the token is already attested (in an unclean env)
  }
  provider.destroy()
}


// const attestAgain = async () => {
//   const transaction = await attestFromSolana(
//     connection,
//     SOL_BRIDGE_ADDRESS,
//     SOL_TOKEN_BRIDGE_ADDRESS,
//     payerAddress,
//     mintAddress
//   );
//   const signed = await wallet.signTransaction(transaction);
//   const txid = await connection.sendRawTransaction(signed.serialize());
//   await connection.confirmTransaction(txid);
//   // Get the sequence number and emitter address required to fetch the signedVAA of our message
//   const info = await connection.getTransaction(txid);
//   const sequence = parseSequenceFromLogSolana(info);
//   const emitterAddress = await getEmitterAddressSolana(SOL_TOKEN_BRIDGE_ADDRESS);
//   // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
//   const { signedVAA } = await getSignedVAA(
//     WORMHOLE_RPC_HOST,
//     CHAIN_ID_SOLANA,
//     emitterAddress,
//     sequence
//   );
//   // Create the wrapped token on Ethereum
//   await createWrappedOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, signedVAA);
// }