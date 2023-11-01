FROM node:latest
WORKDIR /app
COPY . /app
RUN apt update
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --unsafe-perm=true --allow-root
##return project.commands && project.commands.length ? project.commands.split('\n').map(cmd => `RUN ${cmd}`).join('\n') : ''*/
##return project.envVars && project.envVars.length ? project.envVars.map(evar => `ENV ${evar.name}="${evar.value}"`).join('\n') : ''*/
##return project.expPorts && project.expPorts.length ? project.expPorts.map(port => `EXPOSE ${port}`).join('\n') : ''*/
##return `EXPOSE ${project.port}`*/
CMD [ "node", "./app.js" ]
