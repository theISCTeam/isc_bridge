# ISC Multichain Bridge

Native ISC to Native ISC multichain bridge powered by Wormhole.

The architecture is designed to have a limited controlled exposure to ISC in the event of a bridge hack.


![ISC bridge diagram](isc_bridge.svg "ISC bridge architecture")

## Design

We use an intermediary token called OIL (think engine oil...) that can be bridged to all chains supported by Wormhole (say Ethereum, Avalanche, Arbitrum, Osmosis). The `OIL token contract` is deployed to the chain your token natively lives on (say, Solana) and allows any user that wants to bridge your native token to another chain, to swap your native token for OIL, and using Wormhole to bridge it and receive xOIL on the destination chain.

On the destination chain,, you deploy a `swap contract` together with a `native mint contract` for your token. The `swap contract` allows anyone who bridged xOIL to swap it for your native token. You should periodically fund the swap contract with your native token by minting it and sending it to the `swap`.

## Local Development

Requires Docker and golang to be installed. Make sure [k8s is enabled](https://docs.docker.com/desktop/get-started/#kubernetes)

```bash
make install-devnet
make up-devnet
```