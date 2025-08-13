package com.cookiesync.mapper;

import com.cookiesync.entity.CookieData;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * Cookie数据Mapper接口
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Mapper
public interface CookieDataMapper {

    /**
     * 插入Cookie数据
     */
    @Insert("INSERT INTO cookie_data (user_id, encrypted_data, data_size, cookie_count, user_agent, client_ip, version, expire_time, remark) " +
            "VALUES (#{userId}, #{encryptedData}, #{dataSize}, #{cookieCount}, #{userAgent}, #{clientIp}, #{version}, #{expireTime}, #{remark})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(CookieData cookieData);

    /**
     * 根据用户ID查询Cookie数据
     */
    @Select("SELECT * FROM cookie_data WHERE user_id = #{userId} AND status = 0")
    CookieData findByUserId(@Param("userId") String userId);

    /**
     * 根据用户ID更新Cookie数据
     */
    @Update("UPDATE cookie_data SET encrypted_data = #{encryptedData}, data_size = #{dataSize}, " +
            "cookie_count = #{cookieCount}, user_agent = #{userAgent}, client_ip = #{clientIp}, " +
            "version = #{version}, expire_time = #{expireTime}, update_time = NOW() " +
            "WHERE user_id = #{userId} AND status = 0")
    int updateByUserId(CookieData cookieData);

    /**
     * 根据用户ID删除Cookie数据（逻辑删除）
     */
    @Update("UPDATE cookie_data SET status = 1, update_time = NOW() WHERE user_id = #{userId}")
    int deleteByUserId(@Param("userId") String userId);

    /**
     * 查询过期的Cookie数据
     */
    @Select("SELECT * FROM cookie_data WHERE expire_time < NOW() AND status = 0 LIMIT #{limit}")
    List<CookieData> findExpiredData(@Param("limit") int limit);

    /**
     * 批量删除过期数据
     */
    @Update("UPDATE cookie_data SET status = 1, update_time = NOW() WHERE expire_time < NOW() AND status = 0")
    int deleteExpiredData();

    /**
     * 统计用户Cookie数据
     */
    @Select("SELECT COUNT(*) FROM cookie_data WHERE user_id = #{userId} AND status = 0")
    int countByUserId(@Param("userId") String userId);

    /**
     * 获取系统统计信息
     */
    @Select("SELECT " +
            "COUNT(*) as total_users, " +
            "SUM(cookie_count) as total_cookies, " +
            "SUM(data_size) as total_data_size, " +
            "AVG(cookie_count) as avg_cookies_per_user " +
            "FROM cookie_data WHERE status = 0")
    @Results({
        @Result(property = "totalUsers", column = "total_users"),
        @Result(property = "totalCookies", column = "total_cookies"),
        @Result(property = "totalDataSize", column = "total_data_size"),
        @Result(property = "avgCookiesPerUser", column = "avg_cookies_per_user")
    })
    java.util.Map<String, Object> getSystemStats();
}