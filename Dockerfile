FROM node:lts-alpine as build

ENV NODE_ENV development

COPY . .

RUN yarn install --frozen-lockfile

FROM node:lts-alpine as app

ENV NODE_ENV production

COPY --from=build . .

RUN yarn global add pm2

EXPOSE 3000
EXPOSE 9001

CMD [ "yarn", "run", "production" ]