FROM node:20-alpine

# Install Python and Ansible (for future real implementation)
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir ansible-core ansible-runner

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
