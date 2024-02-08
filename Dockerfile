FROM node:latest
ENV NODE_ENV prod
WORKDIR /tmp
COPY . /tmp
RUN npm config set registry http://registry.npm.taobao.org
RUN cd /tmp \
  && npm install --unsafe-perm=true --allow-root \
  && npm run build \
  && cd /tmp/server \
  && mkdir -p ./views \
  && mv ./public/server-package/index.html ./views/index.html

FROM node:latest
ENV NODE_ENV prod
WORKDIR /app
COPY --from=0 /tmp/server/ /app/
RUN npm config set registry http://registry.npm.taobao.org \
  && npm install --unsafe-perm=true --allow-root
EXPOSE 4000
CMD [ "node", "./app.js" ]
