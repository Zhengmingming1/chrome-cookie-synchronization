-- Cookie同步系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `cookie_sync` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cookie_sync`;

-- 创建Cookie数据表
DROP TABLE IF EXISTS `cookie_data`;
CREATE TABLE `cookie_data` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` varchar(64) NOT NULL COMMENT '用户标识',
  `encrypted_data` longtext NOT NULL COMMENT '加密后的Cookie数据',
  `data_size` bigint NOT NULL DEFAULT '0' COMMENT '数据大小（字节）',
  `cookie_count` int NOT NULL DEFAULT '0' COMMENT 'Cookie数量',
  `user_agent` varchar(512) DEFAULT NULL COMMENT '用户代理信息',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '客户端IP地址',
  `version` int NOT NULL DEFAULT '1' COMMENT '数据版本号',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '数据状态：0-正常，1-已删除',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_expire_time` (`expire_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cookie数据表';

-- 创建同步日志表
DROP TABLE IF EXISTS `sync_log`;
CREATE TABLE `sync_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` varchar(64) NOT NULL COMMENT '用户标识',
  `operation_type` varchar(20) NOT NULL COMMENT '操作类型：UPLOAD-上传，DOWNLOAD-下载',
  `data_size` bigint DEFAULT '0' COMMENT '数据大小（字节）',
  `cookie_count` int DEFAULT '0' COMMENT 'Cookie数量',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '客户端IP地址',
  `user_agent` varchar(512) DEFAULT NULL COMMENT '用户代理信息',
  `success` tinyint NOT NULL DEFAULT '1' COMMENT '操作是否成功：0-失败，1-成功',
  `error_message` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `duration` int DEFAULT '0' COMMENT '操作耗时（毫秒）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步操作日志表';

-- 插入测试数据
INSERT INTO `cookie_data` (`user_id`, `encrypted_data`, `data_size`, `cookie_count`, `user_agent`, `client_ip`, `expire_time`, `remark`) 
VALUES 
('test-user-001', 'eyJ0ZXN0IjoiZGF0YSJ9', 1024, 10, 'Chrome/96.0.4664.110', '127.0.0.1', DATE_ADD(NOW(), INTERVAL 30 DAY), '测试数据');

-- 创建索引优化查询性能
CREATE INDEX `idx_user_id_status` ON `cookie_data` (`user_id`, `status`);
CREATE INDEX `idx_update_time` ON `cookie_data` (`update_time`);

-- 创建定时清理过期数据的存储过程
DELIMITER $$
CREATE PROCEDURE `CleanExpiredCookieData`()
BEGIN
    DECLARE affected_rows INT DEFAULT 0;
    
    -- 删除过期的Cookie数据
    UPDATE `cookie_data` 
    SET `status` = 1, `update_time` = NOW() 
    WHERE `expire_time` < NOW() AND `status` = 0;
    
    SET affected_rows = ROW_COUNT();
    
    -- 记录清理日志
    INSERT INTO `sync_log` (`user_id`, `operation_type`, `success`, `error_message`, `create_time`) 
    VALUES ('SYSTEM', 'CLEANUP', 1, CONCAT('清理过期数据 ', affected_rows, ' 条'), NOW());
    
END$$
DELIMITER ;

-- 创建定时事件（每小时执行一次清理）
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS `event_cleanup_expired_data`
-- ON SCHEDULE EVERY 1 HOUR
-- DO CALL CleanExpiredCookieData();

COMMIT;