FROM node:latest
WORKDIR /app
COPY . /app
# RUN sed -i "s@http://deb.debian.org/debian\n@https://mirrors.tuna.tsinghua.edu.cn/debian\n@g" /etc/apt/sources.list.d/debian.sources
# RUN apt update && apt install vim -y
##return project.bldCmds && project.bldCmds.length ? project.bldCmds.split('\n').map(cmd => `RUN ${cmd}`).join('\n') : ''*/
##return project.envVars && project.envVars.length ? project.envVars.map(evar => `ENV ${evar.name}="${evar.value}"`).join('\n') : ''*/
##return project.expPorts && project.expPorts.length ? project.expPorts.map(port => `EXPOSE ${port}`).join('\n') : ''*/
##return `EXPOSE ${project.port}`*/
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --unsafe-perm=true --allow-root
CMD [ "node", "./app.js" ]
