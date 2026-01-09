FROM node:20-alpine

# Install Python and Ansible (optional, for future real implementation)
# Using --break-system-packages is safe in containers
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --break-system-packages --no-cache-dir ansible-core ansible-runner || echo "Ansible installation skipped"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose health check port
EXPOSE 3001

CMD ["npm", "start"]
