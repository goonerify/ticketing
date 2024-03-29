IMPERATIVE COMMANDS
Passing credentials via environment variable
https://cloud.google.com/docs/authentication/production#passing_variable
WINDOWS
`set GOOGLE_APPLICATION_CREDENTIALS=GOOGLE_CREDENTIALS.json`
LINUX
`export GOOGLE_APPLICATION_CREDENTIALS="GOOGLE_CREDENTIALS.json`

Authenticate Google Cloud API
https://stackoverflow.com/a/63181221/1445318
`gcloud auth login`
`gcloud container clusters get-credentials <cluster name: ticketing-dev> --zone <zone:us-east1-b> --project <project id:ticketing-dev-308807>`
`gcloud config set project <project id>`

TODO: Test Istio, grafana, prometheus etc in gcloud

Mongoose user model vs mongoose user document
Mongoose user model represents the entire collection of users, while Mongoose user document represents one single user

Create a secret
`kubectl create secret generic <name of the secret i.e jwt-secret> --from-literal JWT_KEY=asdf`

Get existing secret
`kubectl get secrets`

Switch cygdrive directory
`cd /cygdrive/e/Projects/Samples/Microservices/ticketing/infra/`

TODO: Test if building services without istio is faster

Start skaffold in dev mode with manual trigger
`skaffold dev --trigger=manual`

Use skaffold profiles to switch between local and GCP contexts
`skaffold dev -p gcb`

TODO: Create a kubernetes ExternalName service to simplify the URL to istio gateway in SSR

Run an interactive shell in a pod
`kubectl exec -it client-depl-7c98465cc6-cqwq5 -c client -- /bin/sh`

Make a cURL request to the ingress gateway from within a pod
`curl http://istio-ingressgateway.istio-system.svc.cluster.local/api/users/currentuser`

cURL HTTP request from client pod to auth pod
`kubectl exec "$(kubectl get pod -l app=client -o jsonpath='{.items[0].metadata.name}')" -c client -- curl -sS auth-srv:3000/api/users/currentuser | grep -o "<title>.*</title>"`

Setup port forwarding on a specific port to a pod running within our cluster
(This should only be used for troubleshooting in a development environment)
`kubectl port-forward <name of the pod><port on local machine: port on the pod>`

NATS streaming server monitoring page
`http://localhost:8222/streaming`
NATS streaming server subscriptions in channels info page
`http://localhost:8222/streaming/channelsz?subs=1`

Restarting a pod: Delete the pod and let the deployment automatically recreate it
`kubectl delete pod/<pod name>`

Disable istio sidecar injection in the default namespace
`kubectl label namespace default istio-injection-`

Enable istio sidecar injection in the default namespace
`kubectl label namespace default istio-injection=enabled`

Connect to orders and tickets mongo pods
`kubectl port-forward <orders-mongo-pod-name> 28017:27017`
`kubectl port-forward <tickets-mongo-pod-name> 29017:27017`
`mongo --host localhost:28017`
`mongo --host localhost:29017`

Connect to mongodb pod and run commands against the mongo database
`kubectl exec -it <pod name for mongodb> mongo`

Useful MongoDB commands
https://docs.mongodb.com/manual/reference/mongo-shell/#command-helpers
List all dbs in a mongo database
`show dbs;`
Switch current mongo database
`use <db name>`
Find a mongodb record
`db.tickets.find({price: 15 })`
Verify that mongodb collection has record(s)
`db.tickets.find({price: 15 }).length()`
Show collections in the current database
`show collections`

NUKE DOCKER IMAGES AND CONTAINERS
(First check that you have pushed the latest image of the erring container to docker hub)
`docker container stop $(docker container ls -aq)`
`docker container rm $(docker container ls -aq) -f`
`docker image rm $(docker image ls -aq) -f`

DIGITAL OCEAN
Authenticating with Doctl
`doctl auth init`

Get connection info for our new cluster
`doctl kubernetes cluster kubeconfig save <cluster_name>`

List all contexts
`kubectl config view`

Use a different context
`kubectl config use-context <context_name>`

Deploy your cluster using aks-engine and the istio.json aks-engine API model definition
`cd E:\Projects\Samples\Devops\Azure\Istio Model`
`aks-engine deploy --subscription-id cec58d51-2b5f-4dcd-a97b-9bac721ae4dc --resource-group "ticketingRG" --dns-prefix "ticketingC-ticketingRG-cec58d" --location "East US" --auto-suffix --api-model istio.json`

TODO
RabbitMQ
Database polling
Get all other pods running
Activate istio control plane pods in AKS
Bookmark all the useful documentation
Figure out how to run standalone services i.e repo per service to monorepo
Deploy services individually without triggering rebuilds of unrelated services

STEPS TO CONFIGURE KUBERNETES WITH ISTIO SERVICE MESH
Create Resource Group
`az group create --name ticketingRG --location "East US"`

Create (and login to) an Azure Container Registry if it doesn't already exist (Optional)

`az acr create --name ticketingRegistry --resource-group ticketingRG --sku Standard`
`az acr login --name ticketingRegistry`

Create a service principal for github if it doesn't exist already

**IMPORTANT: Copy the returned JSON into github secrets AZURE_SERVICE_PRINCIPAL_CREDENTIALS**

`az ad sp create-for-rbac -n "ticketingAppSP" --sdk-auth --role Contributor --scopes /subscriptions/cec58d51-2b5f-4dcd-a97b-9bac721ae4dc/resourceGroups/ticketingRG`

Create Azure kubernetes service
`az aks create --resource-group ticketingRG --name ticketingCluster --node-count 3 --kubernetes-version 1.20.2 --generate-ssh-keys --node-vm-size Standard_DS2_v2 --load-balancer-sku basic --enable-node-public-ip`

From the directory (E:\Projects\Samples\Devops\Azure\Istio Model)
Deploy the cluster using istio.json template

# Reference: https://istio.io/latest/docs/setup/platform-setup/azure/#aks-engine

`cd "E:\Projects\Samples\Devops\Azure\Istio Model"`
`aks-engine deploy --subscription-id cec58d51-2b5f-4dcd-a97b-9bac721ae4dc --resource-group ticketingRG --dns-prefix ticketingC-ticketingRG-cec58d --location "East US" --auto-suffix --api-model istio.json`

Use the <dns_prefix>-<id> cluster ID, to copy your kubeconfig to your machine from the \_output folder
`cp _output\ticketingC-ticketingRG-cec58d-<CLUSTER ID>\kubeconfig\kubeconfig.eastus.json ~/.kube/config`

IMPORTANT: Set context
`az aks get-credentials --admin --name ticketingCluster --resource-group ticketingRG`
**RESTART DOCKER TO RENEW/REFRESH YOUR DOCKER DESKTOP CONFIG IN THE CONFIG FILE**

**IMPORTANT: REMEMBER TO UPDATE GITHUB K8S_KUBE_CONFIG WITH THE NEW CREDENTIALS**
`cd C:\Users\ifean\.kube\config`

<!-- `az aks get-credentials --name ticketingCluster --resource-group ticketingRG` -->

IMPORTANT: Install istio only after context has been set
`istioctl install`

Enable istio sidecar injection in the default namespace (Optional)
`kubectl label namespace default istio-injection=enabled`

Get Istio Gateway IP
`kubectl get service istio-ingressgateway --namespace istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`

Create Secrets for the ticketing app
`kubectl create secret generic jwt-secret --from-literal=JWT_KEY=asdfasdf`
`kubectl create secret generic stripe-secret --from-literal=STRIPE_KEY=sk_test_51If4DQGmbPFPG9W4sGLaMoSx4Y43ObwrFzDvEVaI020wrLX7mysnEXeiEHggKxi0ndk6I9PJeZyDpCrZn2QOe9sO00jKjKb7RZ`

Ensure secrets were created
`kubectl get secrets`

Deploy the app

Get more information from an object using the wide output
`kubectl get pods -o wide`
