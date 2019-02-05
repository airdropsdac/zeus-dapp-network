# Deploying a DSP

## Prerequistes
- EOSIO node with the following configuration:
```
plugin = eosio::state_history_plugin
state-history-endpoint = 0.0.0.0:8889
trace-history = true
contracts-console = true
```
- IPFS Cluster

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

## Register

### dsp-package.json
TBD

### dsp.json
TBD

### Register Package
```
zeus register dapp-service-provider-package \
    ipfservices myprovider package1 \
    --key $ACTIVE_PRIVATE_KEY \
    --min-stake-quantity 1.000 \
    --package-period 3600 \
    --quota 0.100 \
    --api-endpoint https://api.acme-dsp.com \
    --package-json-uri https://acme-dsp.com/dsp-package.json
```

For more package options:
```
zeus register dapp-service-provider-package --help 
```