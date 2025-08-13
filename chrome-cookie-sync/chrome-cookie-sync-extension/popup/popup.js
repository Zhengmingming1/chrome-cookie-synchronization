// Cookie同步器弹窗脚本
class CookieSyncPopup {
    constructor() {
        this.currentPage = 'main';
        this.syncStatus = 'idle'; // idle, syncing, success, error
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateStatus();
        this.updateCookieCount();
    }

    bindEvents() {
        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMain();
        });

        // 上传按钮
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.uploadCookies();
        });

        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadCookies();
        });

        // 保存设置按钮
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // 清除数据按钮
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearLocalData();
        });
    }

    showSettings() {
        document.getElementById('settingsPage').style.display = 'block';
        this.currentPage = 'settings';
    }

    showMain() {
        document.getElementById('settingsPage').style.display = 'none';
        this.currentPage = 'main';
    }

    async uploadCookies() {
        if (this.syncStatus === 'syncing') return;

        this.setSyncStatus('syncing');
        this.showProgress('正在收集Cookie数据...');

        try {
            // 获取所有Cookie
            const cookies = await this.getAllCookies();
            console.log('收集到Cookie数量:', cookies.length);
            
            this.updateProgress(30, '正在准备数据...');
            
            // 直接将Cookie数据转换为JSON字符串，不进行Base64编码
            // 后端会自动进行AES加密
            const cookieDataJson = JSON.stringify(cookies);
            console.log('Cookie JSON数据长度:', cookieDataJson.length);
            console.log('Cookie JSON数据前100个字符:', cookieDataJson.substring(0, 100));
            
            this.updateProgress(60, '正在上传到服务器...');
            
            // 上传到服务器
            const result = await this.uploadToServer(cookieDataJson);
            
            this.updateProgress(100, '上传完成');
            
            setTimeout(() => {
                this.setSyncStatus('success');
                this.hideProgress();
                this.showMessage('Cookie数据上传成功！', 'success');
                this.updateLastSyncTime();
            }, 500);

        } catch (error) {
            console.error('上传失败:', error);
            this.setSyncStatus('error');
            this.hideProgress();
            this.showMessage('上传失败: ' + error.message, 'error');
        }
    }

    async downloadCookies() {
        if (this.syncStatus === 'syncing') return;

        this.setSyncStatus('syncing');
        this.showProgress('正在从服务器下载数据...');

        try {
            // 从服务器下载数据
            const rawData = await this.downloadFromServer();
            console.log('从服务器下载的原始数据:', rawData);
            console.log('原始数据类型:', typeof rawData);
            console.log('原始数据长度:', rawData ? rawData.length : 'null');
            
            this.updateProgress(30, '正在解密数据...');
            
            // 解密数据
            const cookies = await this.decryptData(rawData);
            console.log('解密后的Cookie数据:', cookies);
            console.log('Cookie数据类型:', typeof cookies);
            
            if (Array.isArray(cookies)) {
                console.log('Cookie数组长度:', cookies.length);
            } else if (cookies && cookies.cookies && Array.isArray(cookies.cookies)) {
                console.log('Cookie对象中的数组长度:', cookies.cookies.length);
            }
            
            this.updateProgress(60, '正在还原Cookie...');
            
            // 还原Cookie到浏览器
            await this.restoreCookies(cookies);
            
            this.updateProgress(100, '下载完成');
            
            setTimeout(() => {
                this.setSyncStatus('success');
                this.hideProgress();
                this.showMessage('Cookie数据下载成功！', 'success');
                this.updateLastSyncTime();
                this.updateCookieCount();
            }, 500);

        } catch (error) {
            console.error('下载失败详细信息:', error);
            console.error('错误堆栈:', error.stack);
            this.setSyncStatus('error');
            this.hideProgress();
            this.showMessage('下载失败: ' + error.message, 'error');
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

    async encryptData(data) {
        // 这里应该实现真正的加密逻辑
        // 暂时使用Base64编码作为示例
        const jsonString = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    async decryptData(responseData) {
        try {
            console.log('开始解密数据，输入数据类型:', typeof responseData);
            
            // 处理不同的响应格式
            let cookieData;
            
            if (typeof responseData === 'object') {
                if (responseData.data && responseData.data.encryptedData) {
                    // 格式1: {data: {encryptedData: "JSON字符串", ...}}
                    // 这里的encryptedData实际上是已经解密的JSON字符串
                    cookieData = responseData.data.encryptedData;
                    console.log('检测到格式1: data.encryptedData');
                } else if (responseData.data && typeof responseData.data === 'string') {
                    // 格式2: {data: "base64string"}
                    cookieData = responseData.data;
                    console.log('检测到格式2: data字符串');
                } else if (responseData.encryptedData) {
                    // 格式3: {encryptedData: "base64string"}
                    cookieData = responseData.encryptedData;
                    console.log('检测到格式3: encryptedData');
                } else {
                    console.log('响应数据结构:', Object.keys(responseData));
                    throw new Error('无法识别的响应数据格式');
                }
            } else if (typeof responseData === 'string') {
                cookieData = responseData;
                console.log('检测到字符串格式');
            } else {
                throw new Error('无效的数据格式');
            }
            
            console.log('提取到的Cookie数据长度:', cookieData.length);
            console.log('数据前100个字符:', cookieData.substring(0, 100));
            
            // 尝试解析数据
            let parsedData;
            
            // 首先检查是否已经是JSON格式
            if (cookieData.trim().startsWith('[') || cookieData.trim().startsWith('{')) {
                console.log('数据似乎已经是JSON格式，直接解析');
                try {
                    const tempData = JSON.parse(cookieData);
                    console.log('直接JSON解析成功，数据类型:', typeof tempData);
                    console.log('解析后的数据结构键名:', Object.keys(tempData));
                    console.log('解析后的完整数据:', tempData);
                    
                    // 检查解析后的数据结构
                    if (Array.isArray(tempData)) {
                        parsedData = tempData;
                        console.log('解析结果是数组，长度:', parsedData.length);
                    } else if (tempData && tempData.data && typeof tempData.data === 'string') {
                        // 如果解析后是 {data: "base64string"} 格式，需要进一步解码
                        console.log('解析后发现嵌套的data字段，进行Base64解码');
                        console.log('Base64数据长度:', tempData.data.length);
                        console.log('Base64数据前50个字符:', tempData.data.substring(0, 50));
                        
                        try {
                            const base64Data = tempData.data;
                            const decodedString = atob(base64Data);
                            console.log('Base64解码成功，解码后长度:', decodedString.length);
                            console.log('解码后前100个字符:', decodedString.substring(0, 100));
                            
                            parsedData = JSON.parse(decodedString);
                            console.log('嵌套Base64解码成功，Cookie数组长度:', parsedData.length);
                        } catch (base64Error) {
                            console.error('Base64解码失败:', base64Error.message);
                            parsedData = null;
                        }
                    } else {
                        console.log('解析结果格式未知，键名:', Object.keys(tempData));
                        console.log('tempData.data存在吗?', !!tempData.data);
                        console.log('tempData.data类型:', typeof tempData.data);
                        if (tempData.data) {
                            console.log('tempData.data内容前100个字符:', tempData.data.toString().substring(0, 100));
                        }
                        parsedData = null;
                    }
                } catch (e) {
                    console.log('直接JSON解析失败:', e.message);
                    parsedData = null;
                }
            }
            
            // 如果直接解析失败，尝试Base64解码
            if (!parsedData) {
                try {
                    // 清理Base64数据
                    let cleanBase64 = cookieData.replace(/\s/g, ''); // 移除空白字符
                    
                    // 补充Base64 padding
                    const padding = cleanBase64.length % 4;
                    if (padding) {
                        cleanBase64 += '='.repeat(4 - padding);
                    }
                    
                    console.log('尝试Base64解码，清理后长度:', cleanBase64.length);
                    
                    const decodedString = atob(cleanBase64);
                    console.log('Base64解码成功，解码后长度:', decodedString.length);
                    console.log('解码后前100个字符:', decodedString.substring(0, 100));
                    
                    parsedData = JSON.parse(decodedString);
                    console.log('Base64解码后JSON解析成功');
                    
                } catch (error) {
                    console.error('Base64解码失败:', error.message);
                    throw new Error('数据解码失败: ' + error.message);
                }
            }
            
            // 验证解析结果
            if (Array.isArray(parsedData)) {
                console.log('成功解析Cookie数组，长度:', parsedData.length);
                if (parsedData.length > 0) {
                    console.log('第一个Cookie示例:', parsedData[0]);
                }
                return parsedData;
            } else {
                console.log('解析结果不是数组:', typeof parsedData);
                console.log('解析结果内容:', parsedData);
                throw new Error('解析结果格式错误，期望数组格式');
            }
            
        } catch (error) {
            console.error('数据解密失败:', error);
            console.error('错误详情:', error.message);
            throw new Error('数据解密失败: ' + error.message);
        }
    }

    async uploadToServer(data) {
        const settings = await this.getSettings();
        const serverUrl = settings.serverUrl || 'http://localhost:8080';
        const userId = settings.userId || 'anonymous';
        
        console.log('发送上传请求，用户ID:', userId);
        console.log('Cookie数据长度:', data.length);
        console.log('Cookie数据前100个字符:', data.substring(0, 100));
        
        const response = await fetch(`${serverUrl}/api/cookies/upload?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data  // 直接发送加密后的Base64字符串
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`服务器错误: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    async downloadFromServer() {
        const settings = await this.getSettings();
        const serverUrl = settings.serverUrl || 'http://localhost:8080';
        const userId = settings.userId || 'anonymous';
        
        const response = await fetch(`${serverUrl}/api/cookies/download?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`服务器错误: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('服务器响应结构:', {
            hasData: !!result.data,
            dataType: typeof result.data,
            hasEncryptedData: !!(result.data && result.data.encryptedData),
            dataKeys: result.data ? Object.keys(result.data) : []
        });
        
        // 返回完整的响应数据，让decryptData函数处理
        return result;
    }

    async restoreCookies(cookieData) {
        // 确保cookieData是数组格式
        let cookies;
        
        if (Array.isArray(cookieData)) {
            cookies = cookieData;
        } else if (cookieData && Array.isArray(cookieData.cookies)) {
            cookies = cookieData.cookies;
        } else if (cookieData && typeof cookieData === 'object') {
            // 如果是单个cookie对象，转换为数组
            cookies = [cookieData];
        } else {
            throw new Error('Cookie数据格式不正确，无法还原');
        }

        console.log('准备还原Cookie数量:', cookies.length);
        
        let successCount = 0;
        let failCount = 0;
        const failedCookies = [];
        
        // 过滤掉无法设置的特殊Cookie
        const skippedCookies = [];
        const validCookies = cookies.filter(cookie => {
            // 跳过__Host-前缀的Cookie，这些有特殊的安全要求
            if (cookie.name && cookie.name.startsWith('__Host-')) {
                console.info('跳过__Host-前缀Cookie:', cookie.name, '(安全限制)');
                skippedCookies.push({cookie: cookie.name, reason: '__Host-前缀Cookie无法通过扩展设置'});
                return false;
            }
            
            // 跳过__Secure-前缀的Cookie，如果不是HTTPS
            if (cookie.name && cookie.name.startsWith('__Secure-') && !cookie.secure) {
                console.info('跳过__Secure-前缀非安全Cookie:', cookie.name, '(安全限制)');
                skippedCookies.push({cookie: cookie.name, reason: '__Secure-前缀Cookie必须是安全Cookie'});
                return false;
            }
            
            // 跳过一些已知的问题Cookie
            const problematicCookies = ['ewpUid', '_gads', '_gac_', '__gads'];
            if (cookie.name && problematicCookies.some(name => cookie.name.includes(name))) {
                console.info('跳过问题Cookie:', cookie.name, '(已知兼容性问题)');
                skippedCookies.push({cookie: cookie.name, reason: '已知兼容性问题'});
                return false;
            }
            
            // 验证基本数据完整性
            if (!cookie.name || !cookie.domain) {
                console.warn('Cookie数据不完整，跳过:', cookie);
                failedCookies.push({cookie: cookie.name || 'unknown', reason: '数据不完整'});
                failCount++;
                return false;
            }
            
            return true;
        });
        
        console.log(`Cookie过滤结果: 总数${cookies.length}, 有效${validCookies.length}, 跳过${skippedCookies.length}`);
        
        console.log('过滤后有效Cookie数量:', validCookies.length);
        
        for (const cookie of validCookies) {
            try {
                await new Promise((resolve, reject) => {
                    // 改进的URL构建逻辑
                    const url = this.buildCookieUrl(cookie);
                    
                    console.log(`准备设置Cookie: ${cookie.name} for ${url}`);
                    
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
                        // Chrome支持的sameSite值: 'strict', 'lax', 'none'
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
                            console.warn('设置Cookie失败:', cookie.name, chrome.runtime.lastError.message);
                            failCount++;
                            failedCookies.push({
                                cookie: cookie.name, 
                                reason: chrome.runtime.lastError.message,
                                url: url
                            });
                        } else if (result) {
                            console.log('设置Cookie成功:', cookie.name);
                            successCount++;
                        } else {
                            console.warn('设置Cookie返回null:', cookie.name);
                            failCount++;
                            failedCookies.push({
                                cookie: cookie.name, 
                                reason: '设置返回null',
                                url: url
                            });
                        }
                        resolve(result);
                    });
                });
            } catch (error) {
                console.warn('还原Cookie异常:', cookie.name, error);
                failCount++;
                failedCookies.push({cookie: cookie.name, reason: error.message});
            }
        }
        
        console.log(`Cookie还原完成: 成功${successCount}个, 失败${failCount}个`);
        
        if (failedCookies.length > 0) {
            console.log('失败的Cookie详情:', failedCookies);
        }
        
        // 如果有成功的Cookie，就不抛出错误
        if (successCount > 0) {
            console.log(`Cookie还原部分成功: ${successCount}个成功, ${failCount}个失败`);
        } else if (failCount > 0) {
            throw new Error(`所有Cookie还原失败 (共${failCount}个)。主要原因: ${failedCookies.slice(0, 3).map(f => f.reason).join(', ')}`);
        }
        
        return {
            success: successCount,
            failed: failCount,
            failedDetails: failedCookies
        };
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

    setSyncStatus(status) {
        this.syncStatus = status;
        this.updateStatus();
    }

    updateStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        statusDot.className = 'status-dot';
        
        switch (this.syncStatus) {
            case 'syncing':
                statusDot.classList.add('syncing');
                statusText.textContent = '同步中';
                break;
            case 'success':
                statusDot.classList.add('synced');
                statusText.textContent = '已同步';
                break;
            case 'error':
                statusDot.classList.add('error');
                statusText.textContent = '同步失败';
                break;
            default:
                statusText.textContent = '未同步';
        }
    }

    async updateCookieCount() {
        try {
            const cookies = await this.getAllCookies();
            document.getElementById('cookieCount').textContent = cookies.length;
        } catch (error) {
            console.error('获取Cookie数量失败:', error);
            document.getElementById('cookieCount').textContent = '0';
        }
    }

    showProgress(text) {
        document.getElementById('progressArea').style.display = 'block';
        document.getElementById('progressText').textContent = text;
        this.updateProgress(0);
    }

    updateProgress(percent, text) {
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('lay-percent', percent + '%');
        
        if (text) {
            document.getElementById('progressText').textContent = text;
        }
    }

    hideProgress() {
        setTimeout(() => {
            document.getElementById('progressArea').style.display = 'none';
        }, 1000);
    }

    showMessage(message, type) {
        const messageArea = document.getElementById('messageArea');
        const messageContent = document.getElementById('messageContent');
        
        messageContent.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
        
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 3000);
    }

    async loadSettings() {
        const settings = await this.getSettings();
        
        // 设置同步频率
        const freqRadios = document.querySelectorAll('input[name="syncFreq"]');
        freqRadios.forEach(radio => {
            if (radio.value === settings.syncFreq) {
                radio.checked = true;
            }
        });
        
        // 设置服务器地址
        document.getElementById('serverUrl').value = settings.serverUrl || 'http://localhost:8080';
        
        // 设置用户ID
        if (document.getElementById('userId')) {
            document.getElementById('userId').value = settings.userId || 'anonymous';
        }
        
        // 设置加密选项
        document.getElementById('enableEncryption').checked = settings.enableEncryption !== false;
    }

    async saveSettings() {
        const syncFreq = document.querySelector('input[name="syncFreq"]:checked').value;
        const serverUrl = document.getElementById('serverUrl').value;
        const userId = document.getElementById('userId') ? document.getElementById('userId').value : 'anonymous';
        const enableEncryption = document.getElementById('enableEncryption').checked;
        
        const settings = {
            syncFreq,
            serverUrl,
            userId,
            enableEncryption
        };
        
        await this.setSettings(settings);
        this.showMessage('设置保存成功！', 'success');
        
        // 根据设置更新定时任务
        this.updateAlarms(syncFreq);
    }

    async clearLocalData() {
        if (confirm('确定要清除所有本地数据吗？此操作不可恢复。')) {
            await chrome.storage.local.clear();
            this.showMessage('本地数据已清除', 'success');
            this.updateCookieCount();
        }
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['cookieSyncSettings'], (result) => {
                resolve(result.cookieSyncSettings || {});
            });
        });
    }

    async setSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ cookieSyncSettings: settings }, resolve);
        });
    }

    updateLastSyncTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN');
        document.getElementById('lastSync').textContent = `最后同步: ${timeString}`;
        
        // 保存同步时间
        chrome.storage.local.set({ lastSyncTime: now.getTime() });
    }

    async loadLastSyncTime() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['lastSyncTime'], (result) => {
                if (result.lastSyncTime) {
                    const date = new Date(result.lastSyncTime);
                    const timeString = date.toLocaleString('zh-CN');
                    document.getElementById('lastSync').textContent = `最后同步: ${timeString}`;
                }
                resolve();
            });
        });
    }

    updateAlarms(frequency) {
        // 清除现有的定时任务
        chrome.alarms.clear('cookieSync');
        
        // 根据频率设置新的定时任务
        let delayInMinutes;
        switch (frequency) {
            case 'hourly':
                delayInMinutes = 60;
                break;
            case 'daily':
                delayInMinutes = 24 * 60;
                break;
            case 'weekly':
                delayInMinutes = 7 * 24 * 60;
                break;
            default:
                return; // 手动模式不设置定时任务
        }
        
        chrome.alarms.create('cookieSync', {
            delayInMinutes: delayInMinutes,
            periodInMinutes: delayInMinutes
        });
    }
}

// 初始化LayUI
layui.use(['form', 'element'], function() {
    const form = layui.form;
    const element = layui.element;
    
    // 初始化弹窗
    const popup = new CookieSyncPopup();
    
    // 加载最后同步时间
    popup.loadLastSyncTime();
});