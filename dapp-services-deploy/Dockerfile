from node:10
RUN npm install -g @liquidapps/zeus-cmd
RUN cd / && zeus unbox dapp-services-deploy
WORKDIR /dapp-services-deploy

ENV DSP_PRIVATE_KEY=your_dsp_private_key 
ENV DSP_ACCOUNT=dsproviderXX 
ENV IPFS_HOST=localhost 
ENV NODEOS_HOST=localhost 
ENV NODEOS_CHAINID=XXXXXXXXX

ENTRYPOINT ["zeus","start-localenv"]