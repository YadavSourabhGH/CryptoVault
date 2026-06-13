# EC2 Deployment Commands & Reference Guide

This document lists every command used to configure your AWS EC2 instance (`54.197.10.99`), build the application, upload it, and start both the **Client** and **Server** containers.

---

## 1. Local Machine Commands (Build & Package)

To prevent memory crashes on the EC2 instance, we compile the React client locally on the Mac development machine and package the build outputs.

### Set SSH Private Key Permissions
```bash
chmod 400 cryptovault.pem
```

### Compile the Client App Locally
Run inside the `client/` directory:
```bash
npm run build
```
*This generates the compiled static files inside `client/dist/`.*

### Compress and Package the Repository
Run from the root `CryptoVault/` directory:
```bash
tar -czf archive.tar.gz --exclude="node_modules" --exclude=".git" --exclude="archive.tar.gz" -C . .
```
*This archives client, server, docker configs, and the pre-built `dist/` directory, while excluding heavy dependency folders.*

### Upload the Archive to EC2
```bash
scp -i cryptovault.pem archive.tar.gz ubuntu@54.197.10.99:/home/ubuntu/
```

---

## 2. Remote EC2 Configuration Commands

Run these commands on the EC2 instance.

### SSH into the Instance
```bash
ssh -i cryptovault.pem ubuntu@54.197.10.99
```

### Clean Broken Repos & Install Docker
Run these to cleanly install the official Docker Engine and Docker Compose plugins:
```bash
# Remove any corrupted docker list entries
sudo rm -f /etc/apt/sources.list.d/docker.list

# Run the official Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add the 'ubuntu' user to the docker group so you don't have to type sudo for docker commands
sudo usermod -aG docker ubuntu
rm -f get-docker.sh
```
*Note: Exit the SSH session (`exit`) and log back in to apply the group changes.*

---

## 3. Deploy and Run the Containers on EC2

Run these commands inside the EC2 shell after logging back in.

### Extract the Code
```bash
mkdir -p ~/CryptoVault
tar -xzf ~/archive.tar.gz -C ~/CryptoVault
rm ~/archive.tar.gz
```

### Build and Launch the Containers
```bash
cd ~/CryptoVault
docker compose -f docker-compose.prod.yml up --build -d
```

### Verify Container Status and Logs
```bash
# List all running containers
docker ps

# Check the API server logs
docker logs cryptovault-prod-api
```
