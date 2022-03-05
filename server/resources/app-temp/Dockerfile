FROM node:latest
WORKDIR /app
COPY . /app
##return project.commands && project.commands.length ? 'RUN ' + project.commands.split('\n').join(' \\\n  && ') : ''*/
RUN npm config set registry http://registry.npm.taobao.org
RUN npm install --unsafe-perm=true --allow-root
##return `EXPOSE ${project.port}`*/
CMD [ "node", "./app.js" ]
