//import fs from "fs"
import { ethers } from "ethers"
import token_bridge_json from "../config/ITokenBridge.json"
import {
    getEmitterAddressEth,
    parseSequenceFromLogEth,
    tryNativeToHexString,
    parseSequenceFromLogSolana,
    attestFromSolana,
    getEmitterAddressSolana,
    transferFromSolana,
    transferFromEth,
    redeemOnSolana,
    postVaaSolanaWithRetry,
    approveEth,
} from "@certusone/wormhole-sdk"
import { PublicKey, Connection, Keypair} from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

class Wormhole {
    constructor(config) {
        this.acc_info = null
        this.config = config
        this.secretKey = Uint8Array.from(this.config.solana.privateKey);
        this.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(config.solana.spl_ata_program_id);
        this.programId = new PublicKey(this.config.solana.swap_contract);
        this.isc = new PublicKey(this.config.solana.isc);
        this.oil = new PublicKey(this.config.solana.oil);
        this.keypair = Keypair.fromSecretKey(this.secretKey);
        this.connection = new Connection("http://localhost:8899", "confirmed")
        this.options = {
            commitment: 'processed'
        }
        this.deployment = []
        this.wrappedTestTokenAddressFromSolana = null;
        this.user_oil_ata = this.findAssociatedTokenAddress(this.keypair.publicKey, this.oil).toString()
    }

    async attest_from_solana() {
        const network = this.config.solana;
        
        if (!network) {
            throw new Error("Network not defined in config file.");
        }

        const connection = new Connection(network.rpc, "confirmed")
        const secretKey = Uint8Array.from(this.config.solana.privateKey);
        const keypair = Keypair.fromSecretKey(secretKey);

        const transaction = await attestFromSolana(
            connection,
            network.bridgeAddress, //SOL_BRIDGE_ADDRESS,
            network.tokenBridgeAddress, //SOL_TOKEN_BRIDGE_ADDRESS,
            keypair.publicKey.toString(), //payerAddress,
            network.testToken, //mintAddress
        );
        transaction.partialSign(keypair)
        const txid = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(txid);
        // Get the sequence number and emitter address required to fetch the signedVAA of our message
        const info = await connection.getTransaction(txid);
        const sequence = parseSequenceFromLogSolana(info);
        //const sequence = 15;
        const emitterAddress = getEmitterAddressSolana(network.tokenBridgeAddress);
      
        const vaaURL =`${this.config.wormhole.restAddress}/v1/signed_vaa/${1}/${emitterAddress}/${sequence}`;
        console.log("Searching for: ", vaaURL);
        console.log(emitterAddress)
        console.log(sequence)

        // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
        let vaaBytes = await (await fetch(vaaURL)).json();
        while(!vaaBytes.vaaBytes){
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }
        console.log("Bytes found")
        console.log(vaaBytes)
      
        this.deployment.push(vaaBytes.vaaBytes)

        console.log(
            `Solana Network Emitted VAA: `,
            vaaBytes.vaaBytes
        );
        
        // Now create the Wrapped Version of the Token on the target chain
        const targetNetwork = this.config.evm0;
        const targetSigner = new ethers.Wallet(this.config.evm0.privateKey).connect(
            new ethers.providers.JsonRpcProvider(targetNetwork.rpc)
        );
        const targetTokenBridge = new ethers.Contract(
            targetNetwork.tokenBridgeAddress,
            //JSON.parse(
            //    fs
            //        .readFileSync(
            //            "./config/ITokenBridge.json"
            //        )
            //        .toString()
            //).abi,
            token_bridge_json.abi,
            targetSigner
        );    

        await targetTokenBridge.createWrapped(Buffer.from(vaaBytes.vaaBytes, "base64"), {
            gasLimit: 2000000
        })
        console.log("Waiting for 5 seconds")
        await new Promise((r) => setTimeout(r, 5000)); //Time out to let block propagate
        const wrappedTokenAddress = await targetTokenBridge.wrappedAsset(network.wormholeChainId, Buffer.from(tryNativeToHexString(network.testToken, "solana"), "hex"));
        console.log("Wrapped token created at: ", wrappedTokenAddress);
        this.wrappedTestTokenAddressFromSolana = wrappedTokenAddress;
    }

    findAssociatedTokenAddress(
        walletAddress,
        tokenMintAddress
    ) {
        return PublicKey.findProgramAddressSync(
            [
                walletAddress.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                tokenMintAddress.toBuffer(),
            ],
            this.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )[0];
    }

    async send_from_solana(amount) {
        amount = amount*(10**this.config.solana.decimals)

        const secretKey = Uint8Array.from(this.config.solana.privateKey);
        const keypair = Keypair.fromSecretKey(secretKey);
        const targetRecepient = Buffer.from(tryNativeToHexString(this.config.evm0.publicKey, "ethereum"), 'hex');

        const transaction = await transferFromSolana(
            this.connection,
            this.config.solana.bridgeAddress,
            this.config.solana.tokenBridgeAddress,
            keypair.publicKey.toString(),
            this.user_oil_ata,
            this.config.solana.testToken, //mintAddress
            amount,
            targetRecepient, //config.networks[destination_chain].publicKey, //config.networks[destination_chain].tokenBridgeAddress, // targetAddress,
            this.config.evm0.wormholeChainId, //CHAIN_ID_ETH,
        );
        transaction.partialSign(keypair)
        const txid = await this.connection.sendRawTransaction(transaction.serialize());
        console.log("Transfer from Solana to Wormhole", txid)
        // Somehow using this.connection instead of a new connection instiated inside the function is slow for this method
        await this.connection.confirmTransaction(txid);
        return txid
    }

    async get_vaa_bytes_solana(txid) {
        const info = await this.connection.getTransaction(txid);
        const sequence = parseSequenceFromLogSolana(info);
        const emitterAddress = getEmitterAddressSolana(this.config.solana.tokenBridgeAddress);

        const vaaURL =`${this.config.wormhole.restAddress}/v1/signed_vaa/${1}/${emitterAddress}/${sequence}`;
        console.log("Searching for: ", vaaURL);
        // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
        let vaaBytes = await (await fetch(vaaURL)).json();
        while(!vaaBytes.vaaBytes){
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }
        console.log("Bytes found")
        console.log(vaaBytes)
        return vaaBytes
    }

    async complete_transfer_on_eth(vaaBytes) {
        // Now create the Wrapped Version of the Token on the target chain
        const targetSigner = new ethers.Wallet(this.config.evm0.privateKey).connect(
            new ethers.providers.JsonRpcProvider(this.config.evm0.rpc)
        );
        const targetTokenBridge = new ethers.Contract(
            this.config.evm0.tokenBridgeAddress,
            //JSON.parse(
            //    fs
            //        .readFileSync(
            //            "./config/ITokenBridge.json"
            //        )
            //        .toString()
            //).abi,
            token_bridge_json.abi,
            targetSigner
        );    
        const completeTransferTx = await targetTokenBridge.completeTransfer(Buffer.from(vaaBytes.vaaBytes, "base64"));
        const tx_log = await completeTransferTx.wait();
        console.log("Complete Transfer TX: ", tx_log['transactionHash']);
        return tx_log['transactionHash']
    }

    async bridge_from_solana(amount) {
        const txid = await this.send_from_solana(amount)
        console.log(txid)
        const vaa = await this.get_vaa_bytes_solana(txid)
        console.log(vaa)
        const tx = await this.complete_transfer_on_eth(vaa)
        console.log(tx)
        return tx
    }

    async send_from_ethereum(amount) {
        amount = amount*(10**this.config.evm0.decimals)
        const source_chain = 'evm0';
        const destination_chain = 'solana';
        let network = this.config[source_chain];
        const targetNetwork = this.config[destination_chain];
        const recipientAddress = Buffer.from(tryNativeToHexString(this.user_oil_ata, "solana"), "hex");
        const signer = new ethers.Wallet(network.privateKey).connect(
            new ethers.providers.JsonRpcProvider(network.rpc)
        );
        const approval = await approveEth(network.tokenBridgeAddress, network.xoil, signer, amount)
        console.log("Approval limit set", approval['transactionHash'])
        const receipt = await transferFromEth(
            network.tokenBridgeAddress, //ETH_TOKEN_BRIDGE_ADDRESS,
            signer,
            network.xoil, //tokenAddress,
            amount,
            targetNetwork.wormholeChainId, //CHAIN_ID_SOLANA,
            recipientAddress
        );
        console.log("Finished transferring from ETH", receipt['transactionHash'])
        return receipt
    }

    async get_vaa_bytes_ethereum(receipt) {
        // Get the sequence number and emitter address required to fetch the signedVAA of our message
        const sequence = parseSequenceFromLogEth(receipt, this.config.evm0.bridgeAddress); //ETH_BRIDGE_ADDRESS);
        const emitterAddress = getEmitterAddressEth(this.config.evm0.tokenBridgeAddress); //ETH_TOKEN_BRIDGE_ADDRESS);
        const vaaURL =`${this.config.wormhole.restAddress}/v1/signed_vaa/${this.config.evm0.wormholeChainId}/${emitterAddress}/${sequence}`;
        console.log("Searching for: ", vaaURL);
        // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
        let vaaBytes = await (await fetch(vaaURL)).json();
        while(!vaaBytes.vaaBytes){
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }
        console.log("Bytes found")
        console.log(vaaBytes)
        return vaaBytes
    }

    async complete_transfer_on_solana(vaaBytes) {
        let txid = await postVaaSolanaWithRetry(
            this.connection,
            async (transaction) => {
                transaction.partialSign(this.keypair);
                return transaction;
            },
            this.config.solana.bridgeAddress, //srcNetwork.bridgeAddress,
            this.keypair.publicKey.toString(), //srcKey.publicKey.toString(),
            Buffer.from(vaaBytes.vaaBytes, "base64"),
            10
        );
        console.log("Posted VAA to Solana \n", txid[0]['signature'], "\n", txid[1]['signature'])
        // Finally, redeem on Solana
        const transaction = await redeemOnSolana(
            this.connection,
            this.config.solana.bridgeAddress, //SOL_BRIDGE_ADDRESS,
            this.config.solana.tokenBridgeAddress, //SOL_TOKEN_BRIDGE_ADDRESS,
            this.keypair.publicKey.toString(), // payerAddress,
            Buffer.from(vaaBytes.vaaBytes, "base64"), //vaaBytes, //signedVAA,
        );
        transaction.partialSign(this.keypair)
        txid = await this.connection.sendRawTransaction(transaction.serialize());
        await this.connection.confirmTransaction(txid);
        console.log("Token redeemed", txid)
        return txid
    }

    async bridge_to_solana(amount) {
        const txid = await this.send_from_ethereum(amount)
        //console.log(txid['transactionHash'])
        const vaa = await this.get_vaa_bytes_ethereum(txid)
        const tx = await this.complete_transfer_on_solana(vaa)
        return tx
    }
}

//module.exports = Wormhole
export default Wormhole
