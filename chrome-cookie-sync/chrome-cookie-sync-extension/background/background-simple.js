// 简化版Cookie同步器后台服务脚本
console.log('Service Worker启动中...');

// 基础设置
const DEFAULT_SETTINGS = {
    syncFreq: 'manual',
    serverUrl: 'http://localhost:8080',
    userId: 'anonymous',
    enableEncryption: true
};

// Service Worker生命周期事件
self.addEventListener('install', (event) => {
    console.log('Service Worker安装中...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker激活中...');
    event.waitUntil(self.clients.claim());
});

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('扩展安装事件:', details.reason);
    
    if (details.reason === 'install') {
        try {
            // 设置默认配置
            await chrome.storage.sync.set({ cookieSyncSettings: DEFAULT_SETTINGS });
            console.log('默认设置已保存');
            
            // 延迟创建右键菜单，避免竞态条件
            setTimeout(() => {
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
                } catch (error) {
                    console.warn('右键菜单创建异常:', error);
                }
            }, 1000);
            
        } catch (error) {
            console.error('扩展初始化失败:', error);
        }
    }
});

// 监听定时任务
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('定时任务触发:', alarm.name);
    if (alarm.name === 'cookieSync') {
        performAutoSync().catch(error => {
            console.error('自动同步失败:', error);
        });
    }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action);
    
    switch (request.action) {
        case 'getCookies':
            getAllCookies().then(sendResponse).catch(error => {
                console.error('获取Cookie失败:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'setCookies':
            setCookies(request.cookies).then(sendResponse).catch(error => {
                console.error('设置Cookie失败:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'performSync':
            performAutoSync().then(sendResponse).catch(error => {
                console.error('执行同步失败:', error);
                sendResponse({ error: error.message });
            });
            return true;
    }
});

// 监听右键菜单点击 - 添加安全检查
if (typeof chrome !== 'undefined' && chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        console.log('右键菜单点击:', info.menuItemId);
        if (info.menuItemId === 'cookieSync') {
            performAutoSync().catch(error => {
                console.error('右键菜单同步失败:', error);
            });
        }
    });
}

// 获取所有Cookie
async function getAllCookies() {
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

// 设置Cookie
async function setCookies(cookies) {
    const results = [];
    
    for (const cookie of cookies) {
        try {
            const result = await setCookie(cookie);
            results.push({ success: true, cookie: result });
        } catch (error) {
            results.push({ success: false, error: error.message, cookie });
        }
    }
    
    return results;
}

// 设置单个Cookie
async function setCookie(cookie) {
    return new Promise((resolve, reject) => {
        if (!cookie.name || !cookie.domain) {
            reject(new Error('Cookie数据不完整'));
            return;
        }
        
        const url = buildCookieUrl(cookie);
        const cookieDetails = {
            url: url,
            name: cookie.name,
            value: cookie.value || ''
        };

        if (cookie.domain && !isIpAddress(cookie.domain)) {
            cookieDetails.domain = cookie.domain;
        }

        if (cookie.path) {
            cookieDetails.path = cookie.path;
        }

        if (cookie.secure !== undefined) {
            cookieDetails.secure = cookie.secure;
        }

        if (cookie.httpOnly !== undefined) {
            cookieDetails.httpOnly = cookie.httpOnly;
        }

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
}

// 构建Cookie URL
function buildCookieUrl(cookie) {
    let domain = cookie.domain || 'localhost';
    let protocol = cookie.secure ? 'https' : 'http';
    
    if (domain.startsWith('.')) {
        domain = domain.substring(1);
    }
    
    if (domain === 'localhost' || isIpAddress(domain)) {
        protocol = 'http';
    }
    
    let path = cookie.path || '/';
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    return `${protocol}://${domain}${path}`;
}

// 检查是否为IP地址
function isIpAddress(str) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(str);
}

// 执行自动同步
async function performAutoSync() {
    console.log('开始自动同步...');
    // 这里可以添加自动同步逻辑
    return { success: true, message: '自动同步完成' };
}

console.log('Service Worker初始化完成');