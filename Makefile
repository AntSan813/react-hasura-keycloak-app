.PHONY: deploy deploy-hasura deploy-keycloak show-deploy expose-services start-frontend start-app

NAMESPACE := my-app
FRONTEND_DIR := ./ui/

# Start the entire application (both backend and frontend)
start-app: deploy expose-services start-frontend

# Start the frontend server
start-frontend:
	# Starting the frontend server
	cd $(FRONTEND_DIR) && yarn dev &

# Deploy all components (Hasura and Keycloak)
deploy: deploy-hasura deploy-keycloak

# Deploy Hasura
deploy-hasura:
	# Create namespace if it doesn't exist
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	# Build and deploy Hasura
	helm dependency build ./api/hasura
	helm upgrade --install hasura ./api/hasura -f ./api/hasura/values.yaml --namespace $(NAMESPACE)

# Deploy Keycloak
deploy-keycloak:
	# Create namespace if it doesn't exist
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	# Build and deploy Keycloak
	helm dependency build ./api/keycloak
	helm upgrade --install keycloak ./api/keycloak --namespace $(NAMESPACE)

# Show deployment status
show-deploy:
	kubectl get pods --namespace $(NAMESPACE)

# Expose backend services for local access
expose-services:
	# Forward Hasura port
	kubectl port-forward -n $(NAMESPACE) --address 0.0.0.0 $(shell kubectl get pod -n $(NAMESPACE) -l app=hasura-graphql-engine -o jsonpath='{.items[0].metadata.name}') 8080:8080 &
	# Forward Keycloak port
	kubectl port-forward -n $(NAMESPACE) --address 0.0.0.0 keycloak-0 8081:8080 &

