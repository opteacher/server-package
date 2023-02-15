##return project.baseImgs && project.baseImgs.length ? project.baseImgs.map(img => `FROM ${img}`).join('\n') : ''*/
FROM node:latest
WORKDIR /app
COPY . /app
##return project.envVars && project.envVars.length ? project.envVars.map(evar => `ENV ${evar.name}="${evar.value}"`).join('\n') : ''*/
##return project.expPorts && project.expPorts.length ? project.expPorts.map(port => `EXPOSE ${port}`).join('\n') : ''*/
##return project.commands && project.commands.length ? 'RUN ' + project.commands.split('\n').join(' \\\n  && ') : ''*/
RUN npm config set registry http://registry.npm.taobao.org
RUN npm install --unsafe-perm=true --allow-root
##return `EXPOSE ${project.port}`*/
CMD [ "node", "./app.js" ]
