from node:10

RUN apt-get update \
    && apt-get install -y git apt-transport-https curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add 
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update \
    && apt-get install -y kubelet kubeadm kubectl \
    && rm -rf /var/lib/apt/lists/*


RUN curl https://raw.githubusercontent.com/helm/helm/master/scripts/get | bash

RUN npm install -g @liquidapps/zeus-cmd
RUN helm init -c
WORKDIR /
RUN zeus unbox dapp-cluster-k8s
WORKDIR /dapp-cluster-k8s
CMD [ "zeus" ]