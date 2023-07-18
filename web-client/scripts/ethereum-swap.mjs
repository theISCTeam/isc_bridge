//const { ethers } = require("ethers");
import {ethers, BigNumber} from "ethers"
//import fs from "fs"
import erc20_json from "../config/ERC20.json"
import swap_json from "../config/Swap.json"
BigNumber

class EthereumSwap {
    constructor(config) {
        this.config = config.evm0
        //this.erc20_json_abi = JSON.parse(
        //            fs
        //            .readFileSync( "./config/ERC20.json")
        //            .toString())
        //        .abi
        //this.swap_abi = JSON.parse(
        //            fs
        //            .readFileSync( "./config/Swap.json")
        //            .toString())
        //        .abi
        this.erc20_json_abi = erc20_json.abi
        this.swap_abi = swap_json.abi
        this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
        this.Swap = new ethers.Contract(this.config.swap_contract, this.swap_abi, this.provider)
        this.SwapSigner = this.Swap.connect(this.signer)
        this.xOIL = new ethers.Contract(this.config.xoil, this.erc20_json_abi, this.provider)
        this.ISCToken = new ethers.Contract(this.config.isc, this.erc20_json_abi, this.provider)
        this.xOILSigner = this.xOIL.connect(this.signer)
        this.ISCTokenSigner = this.ISCToken.connect(this.signer)
    }

    async print_balance() {
        //const provider = new ethers.JsonRpcProvider();
        let balance = await this.xOIL.balanceOf(this.config.publicKey)
        balance = balance.toBigInt()
        console.log("User OIL:", balance)
        balance = await this.ISCToken.balanceOf(this.config.publicKey)
        balance = balance.toBigInt()
        console.log("User ISC:", balance)
        balance = await this.xOIL.balanceOf(this.config.swap_contract)
        balance = balance.toBigInt()
        console.log("Swap OIL:", balance)
        balance = await this.ISCToken.balanceOf(this.config.swap_contract)
        balance = balance.toBigInt()
        console.log("Swap ISC:", balance)
        console.log("------------------")
    }

    async fetch_balance() {
        let user_isc = await this.ISCToken.balanceOf(this.config.publicKey)
        let user_oil = await this.xOIL.balanceOf(this.config.publicKey)
        let pda_isc = await this.ISCToken.balanceOf(this.config.swap_contract)
        let pda_oil = await this.xOIL.balanceOf(this.config.swap_contract)
        return {
            'user_isc': user_isc / 10**this.config.decimals,
            'user_oil': user_oil / 10**this.config.decimals,
            'pool_isc': pda_isc / 10**this.config.decimals,
            'pool_oil': pda_oil / 10**this.config.decimals,
        }
    }
    

    async swap_back_and_forth() {
        //await this.print_balance();
        //let receipt;
        ////const blocks = await provider.getBlockNumber()
        //const signer = new ethers.Wallet(this.config.privateKey, this.provider);
        ////console.log(blocks)
        //const xOIL = new ethers.Contract(this.config.xoil, this.erc20_json_abi, this.provider)
        //const xOILSigner = xOIL.connect(signer)
        //const ISCToken = new ethers.Contract(this.config.isc, this.erc20_json_abi, this.provider)
        //const ISCTokenSigner = ISCToken.connect(signer);
        ////await ISCTokenSigner.approve("0xaa8751Df9FC4b9424831Fb361F0C14096FC0C204", 10000000)
        ////await xOILSigner.approve("0xaa8751Df9FC4b9424831Fb361F0C14096FC0C204", 10000)
        ////console.log(approval)
        ////let tx = await ISCTokenSigner.transfer("0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", 1)
        ////console.log(tx)

        //const Swap = new ethers.Contract(this.config.swap_contract, this.swap_abi, this.provider)
        //const SwapSigner = Swap.connect(signer)

        let tx = await this.SwapSigner.swap(1, true, {from:this.config.publicKey});//, gasPrice:'20000000000'});
        let receipt = await this.provider.getTransactionReceipt(tx.hash)
        while (!(receipt&&receipt.blockNumber)) {
            await new Promise((r) => setTimeout(r, 50)); //Timeout to let Guardiand pick up log and have VAA ready
            receipt = await this.provider.getTransactionReceipt(tx.hash)
            //console.log("Receipt:", receipt)
            console.log("Waiting for block confirmation")
        }


        console.log(tx)
        await this.print_balance();

        tx = await this.SwapSigner.swap(1, false, {from:this.config.publicKey});//, gasPrice:'20000000000'});
        receipt = await this.provider.getTransactionReceipt(tx.hash)
        while (!(receipt&&receipt.blockNumber)) {
            await new Promise((r) => setTimeout(r, 50)); //Timeout to let Guardiand pick up log and have VAA ready
            receipt = await this.provider.getTransactionReceipt(tx.hash)
            console.log("Waiting for block confirmation")
        }
        await this.print_balance();
    }

    async wait_until_finalized(tx) {
        let receipt = await this.provider.getTransactionReceipt(tx.hash)
        while (!(receipt&&receipt.blockNumber)) {
            await new Promise((r) => setTimeout(r, 500)); //Timeout to let Guardiand pick up log and have VAA ready
            receipt = await this.provider.getTransactionReceipt(tx.hash)
            console.log("Waiting for block confirmation")
        }
    }

    async swap(amount, to_native) {
        const tx = await this.SwapSigner.swap(amount, to_native, {from:this.config.publicKey});//, gasPrice:'20000000000'});
        await this.wait_until_finalized(tx)
        return tx
    }
    
    async swap_oil_to_isc(amount) {
        amount = amount * (10**this.config.decimals)
        let tx = await this.xOILSigner.approve(this.config.swap_contract, amount)
        await this.wait_until_finalized(tx)
        tx = await this.swap(amount, true)
        return tx['hash']
    }

    async swap_isc_to_oil(amount) {
        amount = amount * (10**this.config.decimals)
        let tx = await this.ISCTokenSigner.approve(this.config.swap_contract, amount)
        await this.wait_until_finalized(tx)
        tx = await this.swap(amount, false)
        return tx['hash']
    }

    async mint_isc(amount) {
        amount = amount * (10**this.config.decimals)
        let tx = await this.ISCTokenSigner.mint(this.config.swap_contract, amount)
        await this.wait_until_finalized(tx)
    }

    async burn(amount) {
        amount = amount * (10**this.config.decimals)
        let tx = await this.ISCTokenSigner.burn(amount)
        await this.wait_until_finalized(tx)
    }
}

//module.exports = EthereumSwap
export default EthereumSwap
