# prereqs
- zeus-cmd
- nodeos with
-       plugin = eosio::state_history_plugin
-       state-history-endpoint = 0.0.0.0:8889
-       trace-history = true
-       contracts-console = true
- ipfs cluster

# Install & Run

```
zeus unbox dapp-services-deploy
cd dapp-services-deploy
PKEY=[dsp_private_key] PROOF_PROVIDER_ACCOUNT=dsprovider55 IPFS_HOST=localhost NODEOS_HOST=localhost NODEOS_CHAINID=... NODEOS_WEBSOCKET_PORT=8889 zeus start-localenv
```