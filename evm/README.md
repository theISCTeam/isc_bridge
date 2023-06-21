# EVM Components of the ISC Bridge

To bridge ISC to an EVM chain (e.g. Ethereum) the user has to send OIL tokens via the Wormhole bridge to receive xOIL on the destination EVM chain. xOIL can then be converted to native ISC via the custom smart contract `xOilSwap`

## Contracts used

**xOilSwap**
This contract always stores a balance of ISC. 
It exposes a `Swap` function that enables any user to swap xOIL to ISC. `Swap` validates that xOIL is the correct Wormhole-wrapped-token of the original OIL token minted on Solana.

**CustomMintableToken**
A standard Ownable ERC20 with Mint/Burn functionalities.

## Required dependencies

This project uses Foundry: [please install here](https://book.getfoundry.sh/getting-started/installation).

## Use in a local testnet environment:

You can play around with the contracts in Anvil, a local testnet environment provided by Foundry.
To run, in a terminal window run:

```bash
anvil
```

Create a .env file as such:
```
PRIVATE_KEY=<Your private key>
MNEMONIC=<Your Mnemonic>
```

And run:
```bash
source .env
```

Next we're going to deploy all relevant contracts.

1. Deploy the native token (keep track of the contract address in the output of the transaction):
    ```bash
    make deploy-native-token-local-testnet
    ```

2. Deploy the xOIL Mock token (keep track of the contract address in the output of the transaction):
    ```bash
    make deploy-mock-xOIL-token-local-testnet
    ```

3. Then finally deploy the xOilSwap contract (make sure to edit [./script/XOilSwap.s.sol](./script/XOilSwap.s.sol) as specified in the file):
    ```bash
    make deploy-xOilSwap-contract-local-testnet
    ```

All that's left now is to fund the swap contract with the native token, and to approve the swap contract to spend xOil in the name of the user. Then the user can successfully swap xOil for native token.