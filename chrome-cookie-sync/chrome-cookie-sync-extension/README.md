# Chrome Cookie同步扩展程序

一个安全的Chrome浏览器扩展，用于将Cookie数据同步到云端服务器，支持多设备间的会话状态同步。

## 功能特性

- 🔄 **自动Cookie上传**：定期将浏览器Cookie数据上传到云端
- 📥 **Cookie数据下载**：从云端恢复Cookie数据到浏览器
- ⏰ **灵活同步频率**：支持手动、每小时、每天、每周同步
- 🔒 **数据安全加密**：使用AES加密算法保护Cookie数据
- 📊 **实时状态显示**：显示同步进度和Cookie统计信息
- ⚙️ **个性化设置**：自定义服务器地址和安全选项

## 安装方法

### 开发者模式安装

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本项目的 `chrome-cookie-sync-extension` 文件夹
5. 扩展程序安装完成，可在工具栏看到Cookie同步器图标

### 图标文件生成

如果图标文件缺失，请：

1. 在浏览器中打开 `assets/create_icons.html`
2. 页面会自动生成并下载所需的PNG图标文件
3. 将下载的图标文件放入 `assets/` 目录

## 使用说明

### 基本操作

1. **点击扩展图标**：打开Cookie同步器弹窗
2. **立即上传**：手动将当前Cookie上传到云端
3. **立即下载**：从云端下载Cookie并恢复到浏览器
4. **查看状态**：实时显示同步状态和Cookie数量

### 设置配置

1. 点击弹窗右上角的设置图标
2. **同步频率**：选择自动同步的时间间隔
3. **服务器地址**：配置后端API服务器地址
4. **安全选项**：启用/禁用数据加密功能
5. **清除数据**：清除本地存储的所有数据

## 技术架构

### 前端技术栈
- **Chrome Extension API**：Manifest V3规范
- **LayUI 2.x**：UI组件库
- **JavaScript ES6+**：核心逻辑实现
- **CSS3**：样式和动画效果

### 后端技术栈（需要单独部署）
- **Spring Boot 3.x**：后端框架
- **MyBatis**：ORM框架
- **MySQL 8.0**：数据库
- **Redis 7.x**：缓存系统
- **Spring Security 6.x**：安全框架

## 项目结构

```
chrome-cookie-sync-extension/
├── manifest.json           # 扩展清单文件
├── popup/                  # 弹窗页面
│   ├── popup.html         # 弹窗HTML
│   ├── popup.css          # 弹窗样式
│   └── popup.js           # 弹窗逻辑
├── background/             # 后台脚本
│   └── background.js      # 后台服务
├── assets/                 # 资源文件
│   ├── icon.svg           # SVG图标
│   ├── icon16.png         # 16x16图标
│   ├── icon32.png         # 32x32图标
│   ├── icon48.png         # 48x48图标
│   ├── icon128.png        # 128x128图标
│   └── create_icons.html  # 图标生成工具
├── lib/                    # 第三方库
│   └── layui/             # LayUI框架
└── README.md              # 说明文档
```

## API接口

扩展程序需要配合后端API服务使用：

### 上传Cookie
```
POST /api/cookies/upload
Content-Type: application/json

{
  "data": "加密的Cookie数据",
  "timestamp": 1640995200000,
  "userAgent": "Chrome/96.0.4664.110"
}
```

### 下载Cookie
```
GET /api/cookies/download
Content-Type: application/json

Response:
{
  "success": true,
  "data": "加密的Cookie数据",
  "timestamp": 1640995200000
}
```

## 安全说明

- Cookie数据在传输前会进行AES加密
- 支持HTTPS协议确保传输安全
- 本地存储使用Chrome的安全存储API
- 不会收集用户的个人隐私信息

## 开发调试

1. 修改代码后，在扩展管理页面点击"重新加载"
2. 使用Chrome开发者工具调试弹窗页面
3. 查看后台页面：`chrome://extensions/` → 详细信息 → 背景页
4. 检查控制台输出和网络请求

## 注意事项

- 首次使用需要配置后端服务器地址
- 确保后端API服务正常运行
- 建议定期备份重要的Cookie数据
- 不同浏览器间的Cookie可能存在兼容性问题

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持Cookie上传下载功能
- 实现定时同步机制
- 添加数据加密保护
- 完成LayUI界面设计