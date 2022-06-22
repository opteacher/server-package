FROM node:16.15.1
ENV NODE_ENV prod
WORKDIR /app
COPY . /app
RUN npm config set registry http://registry.npm.taobao.org
RUN cd /app \
  && npm install --unsafe-perm=true --allow-root \
  && npm run build
RUN cd /app/server \
  && npm install --unsafe-perm=true --allow-root \
  && mkdir -p ./views \
  && mv ./public/server-package/index.html ./views/index.html
EXPOSE 4000
CMD [ "node", "./app.js" ]
