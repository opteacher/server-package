FROM node:latest
ENV ENV prod
ENV NODE_OPTIONS --openssl-legacy-provider
WORKDIR /tmp
COPY . /tmp
RUN npm config set registry http://registry.npm.taobao.org
RUN cd /tmp/server \
  && npm install --unsafe-perm=true --allow-root \
  && npm run build \
  && cp -r ./configs/ ./dist/configs/ \
  && cp -r ./resources/ ./dist/resources/
RUN cd /tmp && npm install --unsafe-perm=true --allow-root && npm run build

FROM node:latest
ENV ENV prod
ENV NODE_OPTIONS --openssl-legacy-provider
WORKDIR /app
COPY --from=0 /tmp/server/dist/ /app/
RUN npm config set registry http://registry.npm.taobao.org
RUN npm install --unsafe-perm=true --allow-root
EXPOSE 4000
CMD [ "node", "./app.js" ]
