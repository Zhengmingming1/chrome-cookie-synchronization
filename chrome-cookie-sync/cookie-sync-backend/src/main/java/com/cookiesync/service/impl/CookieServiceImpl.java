package com.cookiesync.service.impl;

import com.cookiesync.entity.ApiResponse;
import com.cookiesync.entity.CookieData;
import com.cookiesync.mapper.CookieDataMapper;
import com.cookiesync.mapper.SyncLogMapper;
import com.cookiesync.service.CookieService;
import com.cookiesync.util.EncryptionUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Cookie数据服务实现类
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Slf4j
@Service
public class CookieServiceImpl implements CookieService {

    @Autowired
    private CookieDataMapper cookieDataMapper;
    
    @Autowired
    private SyncLogMapper syncLogMapper;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private EncryptionUtil encryptionUtil;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String REDIS_KEY_PREFIX = "cookie:";
    private static final int CACHE_EXPIRE_HOURS = 24;

    @Override
    @Transactional
    public ApiResponse<String> uploadCookieData(String userId, String cookieDataJson, String userAgent, String clientIp) {
        long startTime = System.currentTimeMillis();
        
        try {
            // 参数验证
            if (!StringUtils.hasText(userId) || !StringUtils.hasText(cookieDataJson)) {
                return ApiResponse.error("参数不能为空");
            }
            
            // 解析Cookie数据
            JsonNode cookieNode = objectMapper.readTree(cookieDataJson);
            int cookieCount = 0;
            if (cookieNode.isArray()) {
                cookieCount = cookieNode.size();
            } else if (cookieNode.isObject() && cookieNode.has("cookies")) {
                JsonNode cookiesArray = cookieNode.get("cookies");
                cookieCount = cookiesArray.isArray() ? cookiesArray.size() : 0;
            } else {
                // 如果是测试数据或其他格式，设置默认值
                cookieCount = 1;
            }
            
            // 加密Cookie数据
            String encryptedData = encryptionUtil.encrypt(cookieDataJson);
            
            // 创建或更新Cookie数据记录
            CookieData existingData = cookieDataMapper.findByUserId(userId);
            CookieData cookieData = new CookieData();
            cookieData.setUserId(userId);
            cookieData.setEncryptedData(encryptedData);
            cookieData.setDataSize((long) encryptedData.length());
            cookieData.setCookieCount(cookieCount);
            cookieData.setUserAgent(userAgent);
            cookieData.setClientIp(clientIp);
            cookieData.setExpireTime(LocalDateTime.now().plusDays(30));
            
            if (existingData != null) {
                cookieData.setId(existingData.getId());
                cookieData.setVersion(existingData.getVersion() + 1);
                cookieData.setUpdateTime(LocalDateTime.now());
                cookieDataMapper.updateByUserId(cookieData);
            } else {
                cookieData.setVersion(1);  // 设置初始版本号
                cookieData.setCreateTime(LocalDateTime.now());
                cookieData.setUpdateTime(LocalDateTime.now());
                cookieData.setStatus(0);   // 设置状态为正常
                cookieDataMapper.insert(cookieData);
            }
            
            // 更新Redis缓存
            String redisKey = REDIS_KEY_PREFIX + userId;
            redisTemplate.opsForValue().set(redisKey, cookieData, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
            
            // 记录同步日志
            long duration = System.currentTimeMillis() - startTime;
            syncLogMapper.insertLog(userId, "UPLOAD", cookieData.getDataSize(), Integer.valueOf(cookieCount), 
                                  clientIp, userAgent, Boolean.TRUE, null, Integer.valueOf((int) duration), LocalDateTime.now());
            
            log.info("Cookie数据上传成功 - 用户ID: {}, Cookie数量: {}, 数据大小: {} bytes", 
                    userId, cookieCount, cookieData.getDataSize());
            
            return ApiResponse.success("Cookie数据上传成功");
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            syncLogMapper.insertLog(userId, "UPLOAD", 0L, Integer.valueOf(0), clientIp, userAgent, 
                                  Boolean.FALSE, e.getMessage(), Integer.valueOf((int) duration), LocalDateTime.now());
            
            log.error("Cookie数据上传失败 - 用户ID: {}, 错误: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Cookie数据上传失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CookieData> downloadCookieData(String userId, String clientIp, String userAgent) {
        long startTime = System.currentTimeMillis();
        
        try {
            // 参数验证
            if (!StringUtils.hasText(userId)) {
                return ApiResponse.error("用户ID不能为空");
            }
            
            // 先从Redis缓存获取
            String redisKey = REDIS_KEY_PREFIX + userId;
            CookieData cachedData = (CookieData) redisTemplate.opsForValue().get(redisKey);
            
            CookieData cookieData;
            if (cachedData != null) {
                cookieData = cachedData;
                log.debug("从Redis缓存获取Cookie数据 - 用户ID: {}", userId);
            } else {
                // 从数据库获取
                cookieData = cookieDataMapper.findByUserId(userId);
                if (cookieData == null) {
                    return ApiResponse.error("未找到Cookie数据");
                }
                
                // 更新Redis缓存
                redisTemplate.opsForValue().set(redisKey, cookieData, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
                log.debug("从数据库获取Cookie数据并缓存 - 用户ID: {}", userId);
            }
            
            // 检查数据是否过期
            if (cookieData.getExpireTime().isBefore(LocalDateTime.now())) {
                return ApiResponse.error("Cookie数据已过期");
            }
            
            // 解密Cookie数据
            String decryptedData = encryptionUtil.decrypt(cookieData.getEncryptedData());
            cookieData.setEncryptedData(decryptedData);
            
            // 记录同步日志
            long duration = System.currentTimeMillis() - startTime;
            syncLogMapper.insertLog(userId, "DOWNLOAD", cookieData.getDataSize(), 
                                  cookieData.getCookieCount(), clientIp, userAgent, 
                                  Boolean.TRUE, null, Integer.valueOf((int) duration), LocalDateTime.now());
            
            log.info("Cookie数据下载成功 - 用户ID: {}, Cookie数量: {}", userId, cookieData.getCookieCount());
            
            return ApiResponse.success(cookieData);
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            syncLogMapper.insertLog(userId, "DOWNLOAD", 0L, Integer.valueOf(0), clientIp, userAgent, 
                                  Boolean.FALSE, e.getMessage(), Integer.valueOf((int) duration), LocalDateTime.now());
            
            log.error("Cookie数据下载失败 - 用户ID: {}, 错误: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Cookie数据下载失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Boolean> checkCookieDataExists(String userId) {
        try {
            if (!StringUtils.hasText(userId)) {
                return ApiResponse.error("用户ID不能为空");
            }
            
            // 先检查Redis缓存
            String redisKey = REDIS_KEY_PREFIX + userId;
            if (redisTemplate.hasKey(redisKey)) {
                return ApiResponse.success(true);
            }
            
            // 检查数据库
            CookieData cookieData = cookieDataMapper.findByUserId(userId);
            boolean exists = cookieData != null && cookieData.getExpireTime().isAfter(LocalDateTime.now());
            
            return ApiResponse.success(exists);
            
        } catch (Exception e) {
            log.error("检查Cookie数据存在性失败 - 用户ID: {}, 错误: {}", userId, e.getMessage(), e);
            return ApiResponse.error("检查失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<String> deleteCookieData(String userId) {
        try {
            if (!StringUtils.hasText(userId)) {
                return ApiResponse.error("用户ID不能为空");
            }
            
            // 删除数据库记录
            int deleted = cookieDataMapper.deleteByUserId(userId);
            
            // 删除Redis缓存
            String redisKey = REDIS_KEY_PREFIX + userId;
            redisTemplate.delete(redisKey);
            
            if (deleted > 0) {
                log.info("Cookie数据删除成功 - 用户ID: {}", userId);
                return ApiResponse.success("Cookie数据删除成功");
            } else {
                return ApiResponse.error("未找到要删除的数据");
            }
            
        } catch (Exception e) {
            log.error("Cookie数据删除失败 - 用户ID: {}, 错误: {}", userId, e.getMessage(), e);
            return ApiResponse.error("删除失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Object> getCookieDataStats(String userId) {
        try {
            if (!StringUtils.hasText(userId)) {
                return ApiResponse.error("用户ID不能为空");
            }
            
            CookieData cookieData = cookieDataMapper.findByUserId(userId);
            if (cookieData == null) {
                return ApiResponse.error("未找到Cookie数据");
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("cookieCount", cookieData.getCookieCount());
            stats.put("dataSize", cookieData.getDataSize());
            stats.put("version", cookieData.getVersion());
            stats.put("createTime", cookieData.getCreateTime());
            stats.put("updateTime", cookieData.getUpdateTime());
            stats.put("expireTime", cookieData.getExpireTime());
            
            return ApiResponse.success(stats);
            
        } catch (Exception e) {
            log.error("获取Cookie数据统计失败 - 用户ID: {}, 错误: {}", userId, e.getMessage(), e);
            return ApiResponse.error("获取统计信息失败: " + e.getMessage());
        }
    }
}