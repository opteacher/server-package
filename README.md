# server-package
无代码后台编辑平台，原服务器自用包发展而来，所以名字也被沿用。现项目包含如下几大模块：
* 项目自动化部署模块
* 模型可视化编辑模块
* 中台编辑生成模块
* 权限模块
* 可视化服务流程设计模块
## 1. 部署使用
### 1.1 依赖
* **必须组件**：[Docker](https://www.docker.com/)：该平台所有项目都部署在`docker`上
* 本地测试：[MongoDB](https://www.mongodb.com/)：平台数据所依赖的数据库，在`server/configs/db.*.toml`中定义
* 服务器部署：通过`docker-compose`部署，所以可以直接使用`docker`中的`mongodb`
### 1.2 安装流程
#### 1.2.1 本地测试
1. 启动`docker`
> 注意解决好docker必须以附加`sudo`前缀的问题，具体请参考：[这里]()
2. 新增一个`network`：`docker network create server-package_default`
3. 下载：`git clone git@github.com:opteacher/server-package.git`
4. 修改配置：`configs/db.dev.toml`
> 如果没有`mongodb`，则需要在本地或远程部署一个，创建数据库`server-package`，并把配置写进`db.dev.toml`，具体请参考：[部署mongodb](https://www.mongodb.com/try/download/community)
1. 导入子模块：
```bash
cd server-package
git submodule init
git submodule update
```
5. `npm install`：
```bash
npm install --unsafe-perm=true --allow-root # 前端install
cd server
npm install --unsafe-perm=true --allow-root # 后端install
```
6. 回到根目录，启动`npm run serve`，另起一命令行`cd server && npm run start`
#### 1.2.2 服务器部署
1. 确保服务器80端口未被占用
> 平台会启动一个`nginx`实例占用80端口，如固有服务器有`nginx`做代理，则需要停止这个服务
> `sudo service stop nginx`
2. 启动`docker`
> 注意解决好docker必须以附加`sudo`前缀的问题，具体请参考：[这里]()
3. 下载：`git clone git@github.com:opteacher/server-package.git`
4. 确认配置文件：`configs/db.prod.toml`
```toml
[mongo]
database="server-package"
username="root"
password="12345"
host="mongo"
port=27017
```
5. 导入子模块：
```bash
cd server-package
git submodule init
git submodule update
```
6. 直接构建启动：`docker-compose up --build -d`
### 1.3 使用说明
### 1.4 可能的问题
* 错误信息：无权访问本地挂载的`data`文件！
  * 出错步骤：服务器端部署# 6
  * 提升该文件访问权限：`sudo chmod -R 500 data`
## 2. 应用场景
我认为软件开发的本质是提炼和融合，我曾经的一位同事形象地将这过程比喻为`map`和`reduce`。该平台的开发目的便是基于此来的，在经历过多个[nodejs](https://nodejs.org/en/)项目后，我自然而然的总结出了[backend-library](https://github.com/opteacher/backend-library)这个后台自用库。尽管这个库已经极大的提升了开发效率，但重复的`npm init`和复制粘贴让我意识到，项目的生成和部署可以再优化，结果便是这个原来只有一个`docker-compose.yml`的小包发展成现在的规模。
### 2.1 适用对象
适用于对后端要求不高（不用架构）或对后端开发不熟悉的群体，同样也适用于手头项目众多疲于重复新建项目、定义模型的自接自开发同行们。
### 2.2 原后端开发流程
以Node为例：
1. 新建项目文件夹，然后进去`npm init && npm install`；或者干脆使用既存的node框架的cli生成。
> 原谅我很久没关注express、koa或egg之类的后端框架了。
2. 根据项目需要定义ORM模型，根据为模型需求定义增删改查接口（如果是连着前端一起开发的话，则还有列表页、详细页、新增编辑页等等一大堆……）。
3.  定义接口和对应的服务逻辑，然后写测试case，出错了再debug。
4.  打包成服务或微服务部署到服务器，可能还需要调整服务器软件的配置。
### 2.3 与原后端开发流程对比
1. 成功部署启动之后，登录进入首页面
2. 新建配置项目
3. 新建配置模型
4. 新建配置接口
5. 项目同步成功后，使用postman测试
## 3. 现状
### 3.1 问题
### 3.2 展望
## 4. 补充
### 4.1 功能表
