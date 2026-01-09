FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    py3-pip \
    ansible \
    git \
    openssh-client

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
