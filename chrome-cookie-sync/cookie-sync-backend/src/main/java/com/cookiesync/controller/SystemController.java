package com.cookiesync.controller;

import com.cookiesync.entity.ApiResponse;
import com.cookiesync.mapper.CookieDataMapper;
import com.cookiesync.mapper.SyncLogMapper;
import com.cookiesync.util.EncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统管理控制器
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SystemController {

    @Autowired
    private CookieDataMapper cookieDataMapper;
    
    @Autowired
    private SyncLogMapper syncLogMapper;
    
    @Autowired
    private EncryptionUtil encryptionUtil;

    /**
     * 系统健康检查
     */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // 检查数据库连接
            Map<String, Object> dbStats = cookieDataMapper.getSystemStats();
            health.put("database", "正常");
            health.put("stats", dbStats);
            
            // 检查加密功能
            boolean encryptionValid = encryptionUtil.validateEncryption();
            health.put("encryption", encryptionValid ? "正常" : "异常");
            
            health.put("status", "运行正常");
            health.put("timestamp", System.currentTimeMillis());
            
            return ApiResponse.success(health);
            
        } catch (Exception e) {
            log.error("系统健康检查失败", e);
            health.put("status", "异常");
            health.put("error", e.getMessage());
            return ApiResponse.error("系统检查失败");
        }
    }

    /**
     * 获取系统统计信息
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getSystemStats() {
        try {
            Map<String, Object> stats = cookieDataMapper.getSystemStats();
            
            // 获取操作统计
            List<Map<String, Object>> operationStats = syncLogMapper.getOperationStats(LocalDateTime.now().minusDays(7));
            stats.put("operationStats", operationStats);
            
            // 获取最近日志
            List<Map<String, Object>> recentLogs = syncLogMapper.findRecentLogs(10);
            stats.put("recentLogs", recentLogs);
            
            return ApiResponse.success(stats);
            
        } catch (Exception e) {
            log.error("获取系统统计失败", e);
            return ApiResponse.error("获取统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 清理过期数据
     */
    @PostMapping("/cleanup")
    public ApiResponse<Map<String, Object>> cleanupExpiredData() {
        try {
            // 清理过期Cookie数据
            int deletedCookies = cookieDataMapper.deleteExpiredData();
            
            // 清理旧日志（保留30天）
            int deletedLogs = syncLogMapper.cleanOldLogs(LocalDateTime.now().minusDays(30));
            
            Map<String, Object> result = new HashMap<>();
            result.put("deletedCookies", deletedCookies);
            result.put("deletedLogs", deletedLogs);
            result.put("cleanupTime", System.currentTimeMillis());
            
            log.info("数据清理完成 - 删除Cookie数据: {}, 删除日志: {}", deletedCookies, deletedLogs);
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            log.error("数据清理失败", e);
            return ApiResponse.error("数据清理失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户同步统计
     */
    @GetMapping("/user-stats")
    public ApiResponse<Map<String, Object>> getUserStats(@RequestParam("userId") String userId) {
        try {
            Map<String, Object> stats = syncLogMapper.getUserSyncStats(userId, LocalDateTime.now().minusDays(30));
            return ApiResponse.success(stats);
            
        } catch (Exception e) {
            log.error("获取用户统计失败 - 用户ID: {}", userId, e);
            return ApiResponse.error("获取用户统计失败: " + e.getMessage());
        }
    }
}