# Manual deployment of a DSP node

## Prerequistes
- EOSIO node with the following configuration:
```
plugin = eosio::state_history_plugin
state-history-endpoint = 0.0.0.0:8889
trace-history = true
contracts-console = true
```
- IPFS Cluster - https://github.com/ipfs/kubernetes-ipfs/tree/master/ipfs-cluster

## Create an EOS Account for your DSP
## Install & Run
### Install the Zeus SDK

https://github.com/liquidapps-io/zeus-cmd

### Install
```
zeus unbox dapp-services-deploy
```
### Compile & Run
```
cd dapp-services-deploy
zeus compile
DSP_PRIVATE_KEY=your_dsp_private_key \
    DSP_ACCOUNT=dsprovider55 \
    IPFS_HOST=localhost \
    NODEOS_HOST=localhost \
    NODEOS_CHAINID=... \
    NODEOS_WEBSOCKET_PORT=8889 \
    zeus start-localenv
```

### Logs
TBD

### Full Helm chart:

- DSP Cluster - https://github.com/liquidapps-io/dapp-dsp-k8s-helm/blob/master/README.md
