# syntax=docker/dockerfile:1

FROM node:16-alpine


WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --update-cache \
      && apk add --update alpine-sdk \
      && apk add libffi-dev openssl-dev python3-dev \
      && apk --no-cache --update add build-base \
      && npm install

COPY . .

VOLUME ["/app"]
CMD ["npm", "start"]
