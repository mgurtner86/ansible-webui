FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    py3-pip \
    postgresql-client \
    redis \
    && pip3 install --break-system-packages --no-cache-dir ansible-core ansible-runner || echo "Ansible installation skipped"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x start.sh

EXPOSE 3001

CMD ["/bin/sh", "./start.sh"]
