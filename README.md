## 项目概述

Chrome Cookie同步扩展程序是一个基于Chrome Extension Manifest V3规范开发的浏览器扩展，配合Spring Boot后端服务，实现浏览器Cookie数据的云端同步功能。项目采用现代化的技术栈，确保数据安全传输和存储。
浏览器装入插件后可以实现跨设备的同步浏览器的cookie,实现在A设备的登录状态无缝保存到B设备

## 技术架构

### 前端技术栈
- **Chrome Extension**: Manifest V3规范
- **UI框架**: LayUI组件库
- **JavaScript**: ES6+异步编程
- **样式**: Material Design风格

### 后端技术栈
- **框架**: Spring Boot 3.x
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.x
- **ORM**: MyBatis
- **安全**: Spring Security 6.x + AES加密
- **构建工具**: Maven 3.x

