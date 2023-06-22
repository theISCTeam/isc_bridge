.PHONY: # ignore

help:
	@perl -nle'print $& if m{^[a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install-devnet: # install the wormhole dev environment
	git clone --branch main https://github.com/wormhole-foundation/wormhole.git
	curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash

up-devnet: # stand up the wormhole dev environment (Docker k8s must be enabled)
	kubectl config use-context docker-desktop; \
	cd wormhole; \
	tilt up -- --algorand=false --near=false --solana=true;
