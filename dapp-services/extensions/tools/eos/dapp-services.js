import 'mocha';
const { getCreateKeys } = require('./utils');
const {loadModels} = require("../models");

const dappServicesContract = 'dappservices';

async function genAllocateDAPPTokens(deployedContract,serviceName,provider="pprovider1",selectedPackage="default") {
    var key = await getCreateKeys(dappServicesContract);
    var model = (await loadModels("dapp-services")).find(m=>m.name == serviceName);
    var service = model.contract;
    
    var contract = deployedContract.address;
    let servicesTokenContract = await deployedContract.eos.contract(dappServicesContract);

    await servicesTokenContract.issue({
        to: contract,
        quantity: "1000.0000 DAPP",
        memo: ""
    }, {
        authorization: `${dappServicesContract}@active`,
        broadcast: true,
        sign: true,
        keyProvider:[key.privateKey]
    });
    
    await servicesTokenContract.selectpkg({
        owner: contract,
        provider,
        service,
        "package": selectedPackage
    }, {
        authorization: `${contract}@active`,
        broadcast: true,
        sign: true
    });
    await servicesTokenContract.stake({
        from: contract,
        service,
        provider,
        quantity: "500.0000 DAPP"
    }, {
        authorization: `${contract}@active`,
        broadcast: true,
        sign: true
    });
}


module.exports = {genAllocateDAPPTokens, dappServicesContract}