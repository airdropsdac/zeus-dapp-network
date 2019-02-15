from node:10
RUN npm install -g @liquidapps/zeus-cmd
RUN cd / && zeus unbox dapp-services-deploy
WORKDIR /dapp-services-deploy

ENV DSP_PRIVATE_KEY=your_dsp_private_key 
ENV DSP_ACCOUNT=dsproviderXX 
ENV IPFS_HOST=localhost 
ENV NODEOS_HOST=localhost 
ENV NODEOS_CHAINID=aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906

ENTRYPOINT ["node"]