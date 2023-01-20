FROM node:lts-alpine as app

ENV NODE_ENV production

COPY . .

RUN yarn install
RUN yarn global add pm2

EXPOSE 80

CMD [ "yarn", "run", "production" ]