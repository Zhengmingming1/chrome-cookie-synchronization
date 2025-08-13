package com.cookiesync.service;

import com.cookiesync.entity.ApiResponse;
import com.cookiesync.entity.CookieData;

/**
 * Cookie数据服务接口
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
public interface CookieService {
    
    /**
     * 上传Cookie数据
     * 
     * @param userId 用户ID
     * @param cookieDataJson Cookie数据JSON字符串
     * @param userAgent 用户代理
     * @param clientIp 客户端IP
     * @return 操作结果
     */
    ApiResponse<String> uploadCookieData(String userId, String cookieDataJson, String userAgent, String clientIp);
    
    /**
     * 下载Cookie数据
     * 
     * @param userId 用户ID
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     * @return Cookie数据
     */
    ApiResponse<CookieData> downloadCookieData(String userId, String clientIp, String userAgent);
    
    /**
     * 检查Cookie数据是否存在
     * 
     * @param userId 用户ID
     * @return 是否存在
     */
    ApiResponse<Boolean> checkCookieDataExists(String userId);
    
    /**
     * 删除Cookie数据
     * 
     * @param userId 用户ID
     * @return 操作结果
     */
    ApiResponse<String> deleteCookieData(String userId);
    
    /**
     * 获取Cookie数据统计信息
     * 
     * @param userId 用户ID
     * @return 统计信息
     */
    ApiResponse<Object> getCookieDataStats(String userId);
}