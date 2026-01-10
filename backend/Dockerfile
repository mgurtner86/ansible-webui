FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    py3-pip \
    ansible \
    git \
    openssh-client \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev

RUN pip3 install --no-cache-dir --break-system-packages pywinrm[credssp]

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
