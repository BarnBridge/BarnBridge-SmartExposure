FROM node:14.17.1-alpine3.11

WORKDIR /app

RUN apk add --no-cache --update git

COPY package.json yarn.lock ./
RUN yarn install --update-checksums

COPY . .
# RUN cp .env .env
RUN yarn compile

ENTRYPOINT ["yarn"]
