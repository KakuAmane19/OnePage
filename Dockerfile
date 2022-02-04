FROM node:14.16-alpine

ENV PORT=80
EXPOSE 80

COPY . /workdir
WORKDIR /workdir

RUN npm install

CMD [ "npm", "start" ]