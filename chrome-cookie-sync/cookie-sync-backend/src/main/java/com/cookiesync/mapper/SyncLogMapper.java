package com.cookiesync.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * 同步日志Mapper接口
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Mapper
public interface SyncLogMapper {

    /**
     * 插入同步日志
     */
    @Insert("INSERT INTO sync_log (user_id, operation_type, data_size, cookie_count, client_ip, user_agent, success, error_message, duration, create_time) " +
            "VALUES (#{userId}, #{operationType}, #{dataSize}, #{cookieCount}, #{clientIp}, #{userAgent}, #{success}, #{errorMessage}, #{duration}, #{createTime})")
    int insertLog(@Param("userId") String userId,
                  @Param("operationType") String operationType,
                  @Param("dataSize") Long dataSize,
                  @Param("cookieCount") Integer cookieCount,
                  @Param("clientIp") String clientIp,
                  @Param("userAgent") String userAgent,
                  @Param("success") Boolean success,
                  @Param("errorMessage") String errorMessage,
                  @Param("duration") Integer duration,
                  @Param("createTime") java.time.LocalDateTime createTime);

    /**
     * 根据用户ID查询同步日志
     */
    @Select("SELECT * FROM sync_log WHERE user_id = #{userId} ORDER BY create_time DESC LIMIT #{limit}")
    List<Map<String, Object>> findByUserId(@Param("userId") String userId, @Param("limit") int limit);

    /**
     * 查询最近的同步日志
     */
    @Select("SELECT * FROM sync_log ORDER BY create_time DESC LIMIT #{limit}")
    List<Map<String, Object>> findRecentLogs(@Param("limit") int limit);

    /**
     * 统计同步操作
     */
    @Select("SELECT " +
            "operation_type, " +
            "COUNT(*) as count, " +
            "SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count, " +
            "AVG(duration) as avg_duration " +
            "FROM sync_log " +
            "WHERE create_time >= #{startTime} " +
            "GROUP BY operation_type")
    List<Map<String, Object>> getOperationStats(@Param("startTime") java.time.LocalDateTime startTime);

    /**
     * 清理旧日志
     */
    @Delete("DELETE FROM sync_log WHERE create_time < #{cutoffTime}")
    int cleanOldLogs(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);

    /**
     * 获取用户同步统计
     */
    @Select("SELECT " +
            "COUNT(*) as total_operations, " +
            "SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_operations, " +
            "MAX(create_time) as last_sync_time, " +
            "AVG(duration) as avg_duration " +
            "FROM sync_log " +
            "WHERE user_id = #{userId} AND create_time >= #{startTime}")
    Map<String, Object> getUserSyncStats(@Param("userId") String userId, @Param("startTime") java.time.LocalDateTime startTime);
}