from node:10

RUN apt-get update \
    && apt-get install -y git apt-transport-https curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add 
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update \
    && apt-get install -y kubelet kubeadm kubectl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -o /bin/aws-iam-authenticator https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/linux/amd64/aws-iam-authenticator
RUN chmod +x /bin/aws-iam-authenticator
RUN curl https://raw.githubusercontent.com/helm/helm/master/scripts/get | bash

RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && apt-get install google-cloud-sdk -y && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g @liquidapps/zeus-cmd
RUN helm init -c
WORKDIR /
RUN zeus unbox dapp-cluster-k8s
WORKDIR /dapp-cluster-k8s
CMD [ "/bin/bash" ]