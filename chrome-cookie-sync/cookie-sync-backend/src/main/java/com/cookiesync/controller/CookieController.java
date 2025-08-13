package com.cookiesync.controller;

import com.cookiesync.entity.ApiResponse;
import com.cookiesync.entity.CookieData;
import com.cookiesync.service.CookieService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Cookie数据控制器
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/cookies")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CookieController {

    @Autowired
    private CookieService cookieService;

    /**
     * 上传Cookie数据
     */
    @PostMapping("/upload")
    public ApiResponse<String> uploadCookieData(
            @RequestParam(value = "userId", required = false, defaultValue = "anonymous") String userId,
            @RequestBody String cookieDataJson,
            HttpServletRequest request) {
        
        String userAgent = request.getHeader("User-Agent");
        String clientIp = getClientIpAddress(request);
        
        log.info("接收到Cookie上传请求 - 用户ID: {}, IP: {}", userId, clientIp);
        
        return cookieService.uploadCookieData(userId, cookieDataJson, userAgent, clientIp);
    }

    /**
     * 下载Cookie数据
     */
    @GetMapping("/download")
    public ApiResponse<CookieData> downloadCookieData(
            @RequestParam(value = "userId", required = false, defaultValue = "anonymous") String userId,
            HttpServletRequest request) {
        
        String userAgent = request.getHeader("User-Agent");
        String clientIp = getClientIpAddress(request);
        
        log.info("接收到Cookie下载请求 - 用户ID: {}, IP: {}", userId, clientIp);
        
        return cookieService.downloadCookieData(userId, clientIp, userAgent);
    }

    /**
     * 检查Cookie数据是否存在
     */
    @GetMapping("/exists")
    public ApiResponse<Boolean> checkCookieDataExists(@RequestParam("userId") String userId) {
        log.info("检查Cookie数据存在性 - 用户ID: {}", userId);
        return cookieService.checkCookieDataExists(userId);
    }

    /**
     * 删除Cookie数据
     */
    @DeleteMapping("/delete")
    public ApiResponse<String> deleteCookieData(@RequestParam("userId") String userId) {
        log.info("删除Cookie数据 - 用户ID: {}", userId);
        return cookieService.deleteCookieData(userId);
    }

    /**
     * 获取Cookie数据统计信息
     */
    @GetMapping("/stats")
    public ApiResponse<Object> getCookieDataStats(@RequestParam("userId") String userId) {
        log.info("获取Cookie数据统计 - 用户ID: {}", userId);
        return cookieService.getCookieDataStats(userId);
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.success("Cookie同步服务运行正常");
    }

    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        String proxyClientIp = request.getHeader("Proxy-Client-IP");
        if (proxyClientIp != null && !proxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(proxyClientIp)) {
            return proxyClientIp;
        }
        
        String wlProxyClientIp = request.getHeader("WL-Proxy-Client-IP");
        if (wlProxyClientIp != null && !wlProxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(wlProxyClientIp)) {
            return wlProxyClientIp;
        }
        
        return request.getRemoteAddr();
    }
}