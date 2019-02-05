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
### Prepare and host dsp.json 
(draft)
```
{
    "name": "acme DSP",
    "website": "https://acme-dsp.com",
    "code_of_conduct":"https://...",
    "ownership_disclosure" : "https://...",
    "email":"dsp@acme-dsp.com",
    "branding":{
      "logo_256":"https://....",
      "logo_1024":"https://....",
      "logo_svg":"https://...."
    },
    "location": {
      "name": "Atlantis",
      "country": "ATL",
      "latitude": 2.082652,
      "longitude": 1.781132
    },
    "social":{
      "steemit": "",
      "twitter": "",
      "youtube": "",
      "facebook": "",
      "github":"",
      "reddit": "",
      "keybase": "",
      "telegram": "",
      "wechat":""      
    }
    
}

```
### Prepare and host dsp-package.json 
(draft)
```
{
    "name": "Package 1",
    "description": "Best for low vgrabs",
    "dsp_json_uri": "https://acme-dsp.com/dsp.json",
    "logo":{
      "logo_256":"https://....",
      "logo_1024":"https://....",
      "logo_svg":"https://...."
    },
    "service_level_agreement": {
        "availability":{
            "uptime_9s": 5
        },
        "performance":{
            "95": 500,
        },
    },
    "pinning":{
        "ttl": 2400,
        "public": false
    },
    "locations":[
        {
          "name": "Atlantis",
          "country": "ATL",
          "latitude": 2.082652,
          "longitude": 1.781132
        }
    ]
}
```


### Register Package
```
zeus register dapp-service-provider-package \
    ipfs myprovider package1 \
    --key 5JDZU7ZhZ2q8VtbwWzNr49mtx8B7Q29aRNhheDzUdPusRJki... \
    --min-stake-quantity "1.0000" \
    --package-period 3600 \
    --quota "0.1000" \
    --api-endpoint https://api.acme-dsp.com \
    --package-json-uri https://acme-dsp.com/package1.dsp-package.json
```

For more package options:
```
zeus register dapp-service-provider-package --help 
```