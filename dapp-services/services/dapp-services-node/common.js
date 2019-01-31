const paccount = process.env.DSP_ACCOUNT || process.env.PROOF_PROVIDER_ACCOUNT || "pprovider1";
const fetch = require('node-fetch');
const {dappServicesContract} = require("../../extensions/tools/eos/dapp-services")
const {loadModels} = require("../../extensions/tools/models");
const Eos  = require('eosjs');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const httpProxy = require('http-proxy');

const networks = [
    {
        name: "Main Net",
        host: "node2.liquideos.com",
        port: 80,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        secured: false
    },
    {
        name: "Jungle Testnet",
        host: "jungle.cryptolions.io",
        // secured: true,
        chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
        port: 18888
    },
    {
        name: "Localhost",
        host: process.env.NODEOS_HOST || "localhost",
        secured: process.env.NODEOS_SERCURED || false,
        port: process.env.NODEOS_PORT || 8888,
        chainId: process.env.NODEOS_CHAINID,
    }
];

var defaultIndex = 2;
const network = networks[defaultIndex];
var eosconfig = {
    chainId: network.chainId, // 32 byte (64 char) hex string          
    expireInSeconds: 1200,
    sign: true,
};
if (network.secured) {
    eosconfig.httpsEndpoint = 'https://' + network.host + ':' + network.port;
}
else {
    eosconfig.httpEndpoint = 'http://' + network.host + ':' + network.port;
}

const nodeosEndpoint = eosconfig.httpEndpoint;
const proxy = httpProxy.createProxyServer();
var eosPrivate = new Eos(eosconfig);
const forwardEvent = async(act, endpoint, redirect)=>{
    if(redirect)
        return endpoint;
    
    const r = await fetch(endpoint + "/event",{ method: 'POST', body: JSON.stringify(act) });
    await r.text();
    
    return;
}

const resolveBackendServiceData = async (service, provider)=>{
    // console.log('resolving backend service for', service, provider);
    // read from local service models
    var loadedExtensions = await loadModels("dapp-services");
    var loadedExtension = loadedExtensions.find(a=>a.contract == service);
    if(!loadedExtension)
        return;
    
    return {
        internal: true,
        endpoint:"http://localhost:" + loadedExtension.port
    }
}
const resolveExternalProviderData = async (service, provider)=>{
    // read from table at service (providermodel)
    var res = await eosPrivate.getTableRows({
        "json": true,
        "scope": provider,
        "code": service,
        "table": "providermodel",
        "lower_bound": "providermodel",
        "limit": 1
    });
    if(!res.rows.length)
        return;
    var data = res.rows[0];
    return {
        external: true,
        endpoint: data.endpoint
    }
}

const resolveProviderData = async (service, provider)=>{
    return ((paccount == provider) ? resolveBackendServiceData : resolveExternalProviderData) (service, provider);
}

const resolveProvider = async (payer, service, provider)=>{
    if(provider != "")
        return provider;
    return paccount;
    console.log(`resolving provider for payer:${payer} service:${service} ${provider == "" ? '' : 'provider:'}${provider}`);
    // resolve provider
    // get from specific service contract table (providermodel)
    var loadedInExtensionResult = await eosPrivate.getTableRows({
        "json": true,
        "scope": service,
        "code": service,
        "table": "providermdl",
        "limit": 100
    });
    console.log(loadedInExtensionResult);
    // intersect with table at services contract (accountext) - secondary index
    var serviceWithStakingResult = await eosPrivate.getTableRows({
        "json": true,
        "scope": payer,
        "code": dappServicesContract,
        "table": "accountext",
        "lower_bound": payer,
        "limit": 100
    });
    console.log(loadedInExtensionResult);
    var loadedInExtensions = loadedInExtensionResult.rows.map(a=>a.provider);
    var serviceWithStaking = serviceWithStakingResult.rows.map(a=>a.provider);
    // prefer self
    var intersectLists = loadedInExtensions.filter(value => -1 !== serviceWithStaking.indexOf(value));
    if(intersectLists.indexOf(paccount) !== -1)
        return paccount;
    
    // take randomly
    return intersectLists[0];
}

const processFn = async (actionHandlers, actionObject, simulated, serviceName, handlers) =>{
    var actionHandler = actionHandlers[actionObject.event.etype];
    if(!actionHandler)
        return;
    return actionHandler(actionObject, simulated, serviceName, handlers);
}

async function parsedAction(actionHandlers, account,method,code,actData, events, simulated, serviceName, handlers){
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var actionObject =  {
            receiver: account,
            method,
            account: code,
            data: actData, 
            event
        }
        processFn(actionHandlers, actionObject, simulated, serviceName, handlers);
    }
}

async function parseEvents(text){
    return text.split('\n').map(a=>{
        if(a === "")
            return null;
        try{
            return JSON.parse(a);
        }
        catch(e){
        }
    }).filter(a=>a);
}

const handleAction = async (actionHandlers,action, simulated, serviceName, handlers)=>{
    var res = [];

    var events = await parseEvents(action.console);
    await parsedAction(actionHandlers,action.receiver,action.act.name,action.act.account, action.act.data, events, simulated, serviceName, handlers);
    res = [...res,...events];
    for (var i = 0; i < action.inline_traces.length; i++) {
        var subevents = await handleAction(actionHandlers,action.inline_traces[i], simulated,serviceName, handlers);
        res = [...res,...subevents];
    }
    return res;
};
var getRawBody = require('raw-body');
const genNode = async (actionHandlers, port, serviceName, handlers, abi)=>{
    if(handlers)
        handlers.abi = abi;
    const app = genApp();
    app.use(async (req,res,next)=>{
        var uri = req.originalUrl;
        var isServiceRequest = uri.indexOf('/event') == 0;
        if(uri != '/v1/chain/push_transaction' && !isServiceRequest){
            proxy.web(req, res, { target: nodeosEndpoint });
            return;
        }
        
        getRawBody(req, {
            length: req.headers['content-length'],
        }, async function (err, string) {
         if (err) return next(err)
         var body = JSON.parse(string.toString());

        if(isServiceRequest){
            try{
                await processFn(actionHandlers, body, false, serviceName, handlers);
                res.send(JSON.stringify("ok"));
            }
            catch(e){
                res.status(500);
                res.send(JSON.stringify({
                  code:500,
                  error:{
                      details: [{message:e.toString()}]
                  }
                }));
            }
            return;
        }
        while(true){
            var r = await fetch(nodeosEndpoint + uri,{ method: 'POST', body: JSON.stringify(body) });
            var resText = await r.text();
            try{
                var rText = JSON.parse(resText);
                if(r.status == 500){
                    
                    var details = rText.error.details;
                    var detailMsg = details.find(d=>d.message.indexOf(": required service") != -1);
                    if(detailMsg){
                        
                        var jsons = details[details.indexOf(detailMsg)+1].message.split(': ',2)[1].split('\n').filter(a=>a.trim() != '');
                        for (var i = 0; i < jsons.length-1; i++) {
                            var currentEvent = JSON.parse(jsons[i]);
                            var currentActionObject =  {
                                event:currentEvent,
                                exception: true
                            }
                            await processFn(actionHandlers, currentActionObject, true, serviceName, handlers);
                        }
                        var event = JSON.parse(jsons[jsons.length-1]);    
                        var actionObject =  {
                            event,
                            exception: true
                        }
                        var endpoint = await processFn(actionHandlers, actionObject, true, serviceName, handlers);
                        if(endpoint === 'retry'){
                            console.log("retrying")
                            continue;
                        }
                        else if(endpoint){
                            r = await fetch(endpoint + uri,{ method: 'POST', body:JSON.stringify(body) });
                            resText = await r.text();
                            rText = JSON.parse(resText);
                        }
                        res.status(r.status);
                        res.send(JSON.stringify(rText));            
                        return;
                    }
                }
                else{
                    for (var i = 0; i < rText.processed.action_traces.length; i++) {
                        var action = rText.processed.action_traces[i];
                        // skip actions that were already done previously (in exception)
                        await handleAction(actionHandlers, action, true, serviceName, handlers);
                    }
                }
                res.status(r.status);
                res.send(JSON.stringify(rText));
            }
            catch(e){
                res.status(500);
                res.send(JSON.stringify({
                  code:500,
                  error:{
                      details: [{message:e.toString()}]
                  }
                }));
            }
            return;
        }
      });
    
    });
    app.listen(port, () => console.log(`${serviceName} listening on port ${port}!`))
    return app;
}
const genApp = ()=>{
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    return app;
}
const {Serialize} = require('../demux/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const fullabi = (abi) => {
                return {
                  "version": "eosio::abi/1.0",
                    "structs":abi
                };
            };

const deserialize = (abi, data, atype)=>{
    if(!abi)
        return;
    
    var localTypes = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), fullabi(abi));
    var buf1 = Buffer.from(data, "base64");
    var buffer = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
    });
    buffer.pushArray(Serialize.hexToUint8Array(buf1.toString('hex')));
    var theType = localTypes.get(atype);
    if(!theType){
        // console.log('type not found', atype);
        return;
    }
    return theType.deserialize(buffer); 
}


var typesDict = {
    "uint8_t":"uint8",
    "uint16_t":"uint16",
    "uint32_t":"uint32",
    "uint64_t":"uint64",
    "int8_t":"int8",
    "int16_t":"int16",
    "int32_t":"int32",
    "int64_t":"int64",
    "name":"name",
    "eosio::name":"name",
    "asset":"asset",
    "eosio::asset":"asset",
    "std::string":"string",
    "std::vector<char>":"bytes",
    "vector<char>":"bytes",
    "symbol_code":"symbol_code",
    "eosio::symbol_code":"symbol_code"
}
const convertToAbiType = (aType)=>{
    if(!typesDict[aType])
        throw new Error('unrecognized type', aType);
    return typesDict[aType];
}
const generateCommandABI = (commandName, commandModel)=>{
    return {
                "name": commandName,
                "base": "",
                "fields": Object.keys(commandModel.request).map(argName => {return {
                        name: argName,
                        type: convertToAbiType(commandModel.request[argName])
                    };})
            }
}

const generateABI = 
    (serviceModel)=>
        Object.keys(serviceModel.commands).map(c=>generateCommandABI(c,serviceModel.commands[c]))



module.exports = {deserialize, generateABI, genNode, genApp, forwardEvent, resolveProviderData, resolveProvider, processFn, handleAction, paccount, proxy, eosPrivate, eosconfig, nodeosEndpoint}