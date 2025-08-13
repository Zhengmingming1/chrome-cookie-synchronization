package com.cookiesync.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Cookie数据实体类
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CookieData {
    
    /**
     * 主键ID
     */
    private Long id;
    
    /**
     * 用户标识（可以是设备ID或用户ID）
     */
    private String userId;
    
    /**
     * 加密后的Cookie数据
     */
    private String encryptedData;
    
    /**
     * 数据大小（字节）
     */
    private Long dataSize;
    
    /**
     * Cookie数量
     */
    private Integer cookieCount;
    
    /**
     * 用户代理信息
     */
    private String userAgent;
    
    /**
     * 客户端IP地址
     */
    private String clientIp;
    
    /**
     * 数据版本号
     */
    private Integer version;
    
    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    
    /**
     * 过期时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expireTime;
    
    /**
     * 数据状态：0-正常，1-已删除
     */
    private Integer status;
    
    /**
     * 备注信息
     */
    private String remark;
}