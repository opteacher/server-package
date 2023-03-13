FROM node:latest
WORKDIR /app
COPY . /app
RUN mv /etc/apt/sources.list /etc/apt/sources.list.backup \
  && echo deb https://mirrors.tencent.com/debian/ bullseye main non-free contrib > /etc/apt/sources.list \
  && echo deb-src https://mirrors.tencent.com/debian/ bullseye main non-free contrib >> /etc/apt/sources.list \
  && echo deb https://mirrors.tencent.com/debian-security/ bullseye-security main >> /etc/apt/sources.list \
  && echo deb-src https://mirrors.tencent.com/debian-security/ bullseye-security main >> /etc/apt/sources.list \
  && echo deb https://mirrors.tencent.com/debian/ bullseye-updates main non-free contrib >> /etc/apt/sources.list \
  && echo deb-src https://mirrors.tencent.com/debian/ bullseye-updates main non-free contrib >> /etc/apt/sources.list \
  && echo deb https://mirrors.tencent.com/debian/ bullseye-backports main non-free contrib >> /etc/apt/sources.list \
  && echo deb-src https://mirrors.tencent.com/debian/ bullseye-backports main non-free contrib >> /etc/apt/sources.list \
  && apt update
##return project.envVars && project.envVars.length ? project.envVars.map(evar => `ENV ${evar.name}="${evar.value}"`).join('\n') : ''*/
##return project.expPorts && project.expPorts.length ? project.expPorts.map(port => `EXPOSE ${port}`).join('\n') : ''*/
##return project.commands && project.commands.length ? 'RUN ' + project.commands.split('\n').join(' \\\n  && ') : ''*/
RUN npm config set registry http://registry.npm.taobao.org
RUN npm install --unsafe-perm=true --allow-root
##return `EXPOSE ${project.port}`*/
CMD [ "node", "./app.js" ]
