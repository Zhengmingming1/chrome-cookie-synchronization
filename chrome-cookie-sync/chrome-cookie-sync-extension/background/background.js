// Cookie同步器后台服务脚本
class CookieSyncBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupAlarmListener();
        this.setupMessageListener();
        this.setupInstallListener();
    }

    setupAlarmListener() {
        // 监听定时任务
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'cookieSync') {
                this.performAutoSync();
            }
        });
    }

    setupMessageListener() {
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getCookies':
                    this.getAllCookies().then(sendResponse);
                    return true;
                case 'setCookies':
                    this.setCookies(request.cookies).then(sendResponse);
                    return true;
                case 'performSync':
                    this.performAutoSync().then(sendResponse);
                    return true;
            }
        });
    }

    setupInstallListener() {
        // 扩展安装时的初始化
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.initializeExtension().catch(error => {
                    console.error('扩展初始化失败:', error);
                });
            }
        });
    }

    async initializeExtension() {
        try {
            // 设置默认配置
            const defaultSettings = {
                syncFreq: 'manual',
                serverUrl: 'http://localhost:8080',
                userId: 'anonymous',
                enableEncryption: true
            };

            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({ cookieSyncSettings: defaultSettings }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
            
            // 创建右键菜单 - 添加错误处理
            try {
                chrome.contextMenus.create({
                    id: 'cookieSync',
                    title: '同步Cookie',
                    contexts: ['page']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('创建右键菜单失败:', chrome.runtime.lastError.message);
                    } else {
                        console.log('右键菜单创建成功');
                    }
                });
            } catch (menuError) {
                console.warn('右键菜单创建异常:', menuError);
            }
            
            console.log('扩展初始化完成');
        } catch (error) {
            console.error('扩展初始化失败:', error);
        }
    }

    async performAutoSync() {
        try {
            const settings = await this.getSettings();
            
            if (settings.syncFreq === 'manual') {
                return;
            }

            // 获取所有Cookie
            const cookies = await this.getAllCookies();
            
            // 加密数据
            const encryptedData = await this.encryptData(cookies);
            
            // 上传到服务器
            await this.uploadToServer(encryptedData, settings);
            
            // 更新同步时间
            chrome.storage.local.set({ 
                lastSyncTime: Date.now(),
                lastSyncStatus: 'success'
            });
            
            // 发送通知
            this.showNotification('Cookie同步成功', 'Cookie数据已自动同步到云端');
            
        } catch (error) {
            console.error('自动同步失败:', error);
            
            chrome.storage.local.set({ 
                lastSyncStatus: 'error',
                lastSyncError: error.message
            });
            
            this.showNotification('Cookie同步失败', error.message);
        }
    }

    async getAllCookies() {
        return new Promise((resolve, reject) => {
            chrome.cookies.getAll({}, (cookies) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(cookies);
                }
            });
        });
    }

    async setCookies(cookies) {
        const results = [];
        
        for (const cookie of cookies) {
            try {
                const result = await new Promise((resolve, reject) => {
                    // 验证Cookie数据完整性
                    if (!cookie.name || !cookie.domain) {
                        reject(new Error('Cookie数据不完整'));
                        return;
                    }
                    
                    // 使用改进的URL构建逻辑
                    const url = this.buildCookieUrl(cookie);
                    
                    const cookieDetails = {
                        url: url,
                        name: cookie.name,
                        value: cookie.value || ''
                    };

                    // 只有当domain不是IP地址时才设置domain
                    if (cookie.domain && !this.isIpAddress(cookie.domain)) {
                        cookieDetails.domain = cookie.domain;
                    }

                    // 设置路径
                    if (cookie.path) {
                        cookieDetails.path = cookie.path;
                    }

                    // 设置安全属性
                    if (cookie.secure !== undefined) {
                        cookieDetails.secure = cookie.secure;
                    }

                    if (cookie.httpOnly !== undefined) {
                        cookieDetails.httpOnly = cookie.httpOnly;
                    }

                    // 处理sameSite属性
                    if (cookie.sameSite && cookie.sameSite !== 'unspecified' && cookie.sameSite !== 'no_restriction') {
                        const validSameSiteValues = ['strict', 'lax', 'none'];
                        const sameSiteValue = cookie.sameSite.toLowerCase();
                        if (validSameSiteValues.includes(sameSiteValue)) {
                            cookieDetails.sameSite = sameSiteValue;
                        }
                    }

                    // 处理过期时间 - 确保是未来的时间
                    if (cookie.expirationDate && cookie.expirationDate > Date.now() / 1000) {
                        cookieDetails.expirationDate = cookie.expirationDate;
                    }

                    chrome.cookies.set(cookieDetails, (result) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else if (result) {
                            resolve(result);
                        } else {
                            reject(new Error('设置Cookie返回null'));
                        }
                    });
                });
                
                results.push({ success: true, cookie: result });
            } catch (error) {
                results.push({ success: false, error: error.message, cookie });
            }
        }
        
        return results;
    }

    // 构建Cookie URL的辅助方法
    buildCookieUrl(cookie) {
        let domain = cookie.domain || 'localhost';
        let protocol = cookie.secure ? 'https' : 'http';
        
        // 处理以点开头的域名
        if (domain.startsWith('.')) {
            domain = domain.substring(1);
        }
        
        // 处理localhost和IP地址
        if (domain === 'localhost' || this.isIpAddress(domain)) {
            protocol = 'http'; // localhost和IP通常使用http
        }
        
        // 确保路径以/开头
        let path = cookie.path || '/';
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return `${protocol}://${domain}${path}`;
    }

    // 检查是否为IP地址
    isIpAddress(str) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(str) || ipv6Regex.test(str);
    }

    async encryptData(data) {
        const settings = await this.getSettings();
        
        if (!settings.enableEncryption) {
            return JSON.stringify(data);
        }
        
        // 这里应该实现真正的加密逻辑
        // 暂时使用Base64编码作为示例
        const jsonString = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    async decryptData(encryptedData) {
        const settings = await this.getSettings();
        
        if (!settings.enableEncryption) {
            return JSON.parse(encryptedData);
        }
        
        // 这里应该实现真正的解密逻辑
        // 暂时使用Base64解码作为示例
        const jsonString = decodeURIComponent(escape(atob(encryptedData)));
        return JSON.parse(jsonString);
    }

    async uploadToServer(data, settings) {
        const serverUrl = settings.serverUrl || 'http://localhost:8080';
        
        const response = await fetch(`${serverUrl}/api/cookies/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: data,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            })
        });

        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async downloadFromServer(settings) {
        const serverUrl = settings.serverUrl || 'http://localhost:8080';
        
        const response = await fetch(`${serverUrl}/api/cookies/download`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['cookieSyncSettings'], (result) => {
                resolve(result.cookieSyncSettings || {});
            });
        });
    }

    showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../assets/icon48.png',
            title: title,
            message: message
        });
    }
}

// 初始化后台服务
let backgroundService;

// 确保在Service Worker完全加载后再初始化
try {
    backgroundService = new CookieSyncBackground();
    
    // 监听右键菜单点击 - 添加安全检查
    if (chrome.contextMenus && chrome.contextMenus.onClicked) {
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'cookieSync' && backgroundService) {
                backgroundService.performAutoSync().catch(error => {
                    console.error('右键菜单同步失败:', error);
                });
            }
        });
    }
} catch (error) {
    console.error('Service Worker初始化失败:', error);
}

// 添加Service Worker生命周期事件监听
self.addEventListener('install', (event) => {
    console.log('Service Worker安装中...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker激活中...');
    event.waitUntil(self.clients.claim());
});
