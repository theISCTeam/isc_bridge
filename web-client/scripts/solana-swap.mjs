//const { Keypair,
//        Transaction,
//        SystemProgram,
//        Connection,
//        sendAndConfirmTransaction,
//        TransactionInstruction,
//        PublicKey } = require("@solana/web3.js");
//const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')
//const borsh = require('borsh')

import { Keypair,
        Transaction,
        SystemProgram,
        Connection,
        sendAndConfirmTransaction,
        TransactionInstruction,
        PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import borsh from 'borsh'

//const borsh = require('borsh')
//const { Keypair,
//        Transaction,
//        SystemProgram,
//        Connection,
//        sendAndConfirmTransaction,
//        TransactionInstruction,
//        PublicKey } = require("@solana/web3.js");
//const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')

class Parameters {
    constructor(instruction, amount) {
        this.instruction = instruction;
        this.amount = amount;
    }
}

class SolanaSwap {
    constructor(config) {
        this.acc_info = null
        this.config = config.solana
        this.secretKey = Uint8Array.from(this.config.privateKey);
        this.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(this.config.spl_ata_program_id);
        this.programId = new PublicKey(this.config.swap_contract);
        this.isc = new PublicKey(this.config.isc);
        this.oil = new PublicKey(this.config.oil);
        //this.keypair = Keypair.fromSecretKey(this.secretKey);
        this.pubkey = null
        this.user_isc_ata = null
        this.user_oil_ata = null
        this.pda_isc_ata = null
        this.pda_oil_ata = null
        this.provider = null
        //this.wormhole_oil_ata = new PublicKey(this.config.wormhole_oil_ata);
        this.connection = new Connection("http://127.0.0.1:8899")
        this.options = {
            commitment: 'processed'
        }
        this.updateAccounts()
        this.schema = new Map(
            [
                [
                    Parameters, {
                        kind: 'struct',
                        fields: [
                            ['instruction', 'u8'],
                            ['amount', 'u64'],
                        ]
                    }
                ]
            ]
        )
        //this.fetch_provider()
    }

    async fetch_provider() {
        if (typeof window !== "undefined") {
            const getProvider = () => {
                if ('phantom' in window) {
                    const provider = window.phantom?.solana;
                
                    if (provider?.isPhantom) {
                        console.log("Provider is", provider)
                        return provider;

                    } else {
                        return null;
                    }
                }
            };
            this.provider = getProvider()
        }
        if (this.provider != null) {
            try {
                const resp = await this.provider.connect();
                console.log("Public Key is")
                console.log(resp.publicKey.toString());
                this.pubkey = resp.publicKey
                // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 
            } catch (err) {
                // { code: 4001, message: 'User rejected the request.' }
            }
        } else {
            this.keypair = Keypair.fromSecretKey(this.secretKey);
            this.pubkey = this.keypair.publicKey
        }
    }

    async fetch_balance() {
        if (this.pubkey == null) {
            return {
                'user_isc': 0,
                'user_oil': 0,
                'pool_isc': 0,
                'pool_oil': 0,
                'user_sol': 0,
                //'wormhole_oil': wormhole_oil.value.uiAmount
            }
        }
        let user_isc = await this.connection.getTokenAccountBalance(this.user_isc_ata, "processed")
        let user_oil = await this.connection.getTokenAccountBalance(this.user_oil_ata, "processed")
        let user_sol = await this.connection.getBalance(this.pubkey, "processed")
        let pda_isc = await this.connection.getTokenAccountBalance(this.pda_isc_ata, "processed")
        let pda_oil = await this.connection.getTokenAccountBalance(this.pda_oil_ata, "processed")
        //let wormhole_oil = await this.connection.getTokenAccountBalance(this.wormhole_oil_ata, "processed")
        return {
            'user_isc': user_isc.value.uiAmount,
            'user_oil': user_oil.value.uiAmount,
            'pool_isc': pda_isc.value.uiAmount,
            'pool_oil': pda_oil.value.uiAmount,
            'user_sol': user_sol/1_000_000_000,
            //'wormhole_oil': wormhole_oil.value.uiAmount
        }
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

    async updateAccounts() {
        await this.fetch_provider();
        const acc_info_initializer = this.pubkey
        const acc_info_initializer_isc_ata = this.findAssociatedTokenAddress(this.pubkey, this.isc)
        const acc_info_initializer_oil_ata = this.findAssociatedTokenAddress(this.pubkey, this.oil)
        const acc_info_program = this.programId
        const acc_info_pda = PublicKey.findProgramAddressSync([Buffer.from("oolaa")], this.programId)[0]
        const acc_info_pda_isc_ata = this.findAssociatedTokenAddress(acc_info_pda, this.isc)
        const acc_info_pda_oil_ata = this.findAssociatedTokenAddress(acc_info_pda, this.oil)
        const acc_info_isc = this.isc
        const acc_info_oil = this.oil
        const acc_info_token_prog = TOKEN_PROGRAM_ID
        const acc_info_assoc_token_prog = this.SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        const acc_info_sys_prog = SystemProgram.programId

        this.user_isc_ata = acc_info_initializer_isc_ata
        this.user_oil_ata = acc_info_initializer_oil_ata
        this.pda_isc_ata = acc_info_pda_isc_ata
        this.pda_oil_ata = acc_info_pda_oil_ata

        this.acc_info = [
            {  pubkey:  acc_info_initializer,          isSigner:  true,   isWritable:  true   },
            {  pubkey:  acc_info_initializer_isc_ata,  isSigner:  false,  isWritable:  true   },
            {  pubkey:  acc_info_initializer_oil_ata,  isSigner:  false,  isWritable:  true   },
            {  pubkey:  acc_info_program,              isSigner:  false,  isWritable:  false  },
            {  pubkey:  acc_info_pda,                  isSigner:  false,  isWritable:  false  }, // HiCJMeuFfwHVAk2uDN2zDJexnuaqN14YQEjP3X92jPd7
            {  pubkey:  acc_info_pda_isc_ata,          isSigner:  false,  isWritable:  true   },
            {  pubkey:  acc_info_pda_oil_ata,          isSigner:  false,  isWritable:  true   },
            {  pubkey:  acc_info_isc,                  isSigner:  false,  isWritable:  false  },
            {  pubkey:  acc_info_oil,                  isSigner:  false,  isWritable:  false  },
            {  pubkey:  acc_info_token_prog,           isSigner:  false,  isWritable:  false  },
            {  pubkey:  acc_info_assoc_token_prog,     isSigner:  false,  isWritable:  false  },
            {  pubkey:  acc_info_sys_prog,             isSigner:  false,  isWritable:  false  },
        ]
    }

    async swap(param) {
        console.log("00 new function")
        console.log(borsh)
        const data = borsh.serialize(this.schema, param)
        console.log("0 new function")
        const ix = new TransactionInstruction({
            keys:this.acc_info,
            programId: this.programId,
            data:data,
        })
        console.log("1 new function")
        const tx = new Transaction()
        console.log("2 new function")
        tx.add(ix)
        console.log("3 new function")
        console.log(await this.fetch_balance())
        let txid = null
        if (this.provider != null) {
            let blockhash = (await this.connection.getLatestBlockhash('finalized')).blockhash;
            tx.recentBlockhash = blockhash;
            tx.feePayer = this.pubkey
            const tx_signed = await this.provider.signTransaction(tx);
            txid = await this.connection.sendRawTransaction(tx_signed.serialize(), this.options);
        } else {
            txid = await sendAndConfirmTransaction(this.connection, tx, [this.keypair], this.options)
        }
        return txid
    }

    async swap_isc_to_oil(amount) {
        const scaled_amount = amount*(10**this.config.decimals)
        const data = new Parameters(0, scaled_amount)
        return await this.swap(data)
    }

    async swap_oil_to_isc(oil_amount) {
        const scaled_amount = oil_amount*(10**this.config.decimals)
        const data = new Parameters(1, scaled_amount)
        return await this.swap(data)
    }
};

//module.exports = SolanaSwap
export default SolanaSwap
