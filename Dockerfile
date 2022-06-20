FROM node:16.15.1
ENV NODE_ENV prod
ENV NODE_OPTIONS --openssl-legacy-provider
WORKDIR /tmp
COPY . /tmp
RUN npm config set registry http://registry.npm.taobao.org
RUN cd /tmp/server \
  && npm install --unsafe-perm=true --allow-root
RUN cd /tmp \
  && npm install --unsafe-perm=true --allow-root \
  && npm run build \
  && cd /tmp/server \
  && mkdir ./views \
  && mv ./public/server-package/index.html ./views/index.html

FROM node:16.15.1
ENV NODE_ENV prod
ENV NODE_OPTIONS --openssl-legacy-provider
WORKDIR /app
COPY --from=0 /tmp/server/ /app/
RUN npm config set registry http://registry.npm.taobao.org \
  && npm install --unsafe-perm=true --allow-root
EXPOSE 4000
CMD [ "node", "./app.js" ]
