import config from "../config/config.json"
import SolanaSwap from "../scripts/solana-swap.mjs"
import Wormhole from "./wormhole.mjs"
import EthereumSwap from "./ethereum-swap.mjs"

class myApplication {
    constructor() {
        this.solana_swap = new SolanaSwap(config)
        this.wormhole = new Wormhole(config)
        this.ethereum_swap = new EthereumSwap(config)
    }

    print_balance() {
        //console.log(await solana_swap.fetch_balance())
        //console.log(await ethereum_swap.fetch_balance())
        console.log(this.solana_swap.fetch_balance())
    }
}

export default myApplication

//async function main() {
//    const amount = 0.0001
//    //await print_balance()
//    let txid
//    let vaa
//    let tx
//
//    {
//        //Solana ISC to Ethereum ISC
//        //console.log("STARTING SOL -> ETH")
//        txid = await solana_swap.swap_isc_to_oil(amount)
//        //console.log(await wormhole.bridge_from_solana(amount))
//        txid = await wormhole.send_from_solana(amount)
//        vaa = await wormhole.get_vaa_bytes_solana(txid)
//        tx = await wormhole.complete_transfer_on_eth(vaa)
//        txid = await ethereum_swap.swap_oil_to_isc(amount)
//        console.log("Bridge to Ethereum completed", txid)
//    }
//
//
//    //Ethereum ISC to Solana ISC
//    {
//        //console.log("STARTING ETH -> SOL")
//        txid = await ethereum_swap.swap_isc_to_oil(amount)
//        //console.log(await wormhole.bridge_to_solana(amount))
//        txid = await wormhole.send_from_ethereum(amount)
//        vaa = await wormhole.get_vaa_bytes_ethereum(txid)
//        tx = await wormhole.complete_transfer_on_solana(vaa)
//        txid = await solana_swap.swap_oil_to_isc(amount)
//        console.log("Bridge to Solana completed", txid)
//    }
//
//    //console.log(await wormhole.bridge_from_solana(0.00000001))
//
//
//    console.log(await ethereum_swap.fetch_balance())
//    //await ethereum_swap.burn(100)
//    //console.log(await ethereum_swap.fetch_balance())
//}
