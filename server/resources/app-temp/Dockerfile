FROM node:latest
WORKDIR /app
COPY . /app
# RUN sed -i "s@http://deb.debian.org@https://mirrors.163.com@g" /etc/apt/sources.list.d/debian.sources
# RUN apt update
##return project.commands && project.commands.length ? project.commands.split('\n').map(cmd => `RUN ${cmd}`).join('\n') : ''*/
##return project.envVars && project.envVars.length ? project.envVars.map(evar => `ENV ${evar.name}="${evar.value}"`).join('\n') : ''*/
##return project.expPorts && project.expPorts.length ? project.expPorts.map(port => `EXPOSE ${port}`).join('\n') : ''*/
##return `EXPOSE ${project.port}`*/
RUN npm config get cache | xargs rm -r
RUN mv .npm ~
RUN npm config set registry https://mirrors.tuna.tsinghua.edu.cn/npm/
RUN npm install --unsafe-perm=true --allow-root --prefer-offline
CMD [ "node", "./app.js" ]
