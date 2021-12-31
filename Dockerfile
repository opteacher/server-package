FROM node:latest

ENV ENV prod
ENV NODE_OPTIONS --openssl-legacy-provider

WORKDIR /app/server

COPY . /app
RUN npm install cnpm typescript -g --unsafe-perm=true --allow-root
RUN cd /app/server && cnpm install --unsafe-perm=true --allow-root && cnpm run build
RUN cd /app && cnpm install --unsafe-perm=true --allow-root && cnpm run build
RUN cd /app/server/dist && mkdir views/ && mv ./public/server-package/index.html ./views/

EXPOSE 4000

CMD [ "npm", "run", "start" ]
