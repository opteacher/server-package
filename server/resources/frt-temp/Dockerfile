FROM node:latest
WORKDIR /app
COPY . /app
RUN npm config set registry http://registry.npm.taobao.org
RUN npm install --unsafe-perm=true --allow-root
RUN npm run build

FROM mhart/alpine-node:latest
RUN npm install -g npm@8.14.0 && npm i -g http-server
WORKDIR /public
COPY --from=0 /app/dist /public
EXPOSE 8080
ENTRYPOINT [ "http-server" ]
CMD [ "-P", "http://nginx" ]
