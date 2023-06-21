RPC=${GOERLI_RPC_URL} 

.PHONY: # ignore

help:
	@perl -nle'print $& if m{^[a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


build: # build all smart contracts
	forge build


test: # test all smart contracts
	forge test

deploy-native-token-local-testnet: # deploy native token to Anvil local testnet  (you might need to run `source .env` before calling this)
	forge script script/CustomMintableToken.s.sol:NativeTokenDeployScript --fork-url http://localhost:8545 --broadcast

deploy-mock-xOIL-token-local-testnet: # deploy mock xOIL Anvil local testnet  (you might need to run `source .env` before calling this)
	forge script script/CustomMintableToken.s.sol:MockXOilTokenDeployScript --fork-url http://localhost:8545 --broadcast

deploy-xOilSwap-contract-local-testnet: # deploy xOilSwap contract (you might need to run `source .env` before calling this, and ensure you update the script file with the correct token addresses)
	forge script script/XOilSwap.s.sol:XOilSwapDeployScript --fork-url http://localhost:8545 --broadcast

fund-xOilSwap-contract-local-testnet: # deploy xOilSwap contract (you might need to run `source .env` before calling this, and ensure you update the script file with the correct token addresses)
	forge script script/XOilSwap.s.sol:FundXOilSwapScript --fork-url http://localhost:8545 --broadcast

