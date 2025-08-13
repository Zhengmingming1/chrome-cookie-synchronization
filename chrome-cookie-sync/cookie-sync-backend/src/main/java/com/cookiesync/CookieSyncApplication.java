package com.cookiesync;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Cookie同步后端服务启动类
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
@MapperScan("com.cookiesync.mapper")
public class CookieSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(CookieSyncApplication.class, args);
        System.out.println("=================================");
        System.out.println("Cookie同步后端服务启动成功！");
        System.out.println("访问地址: http://localhost:8080");
        System.out.println("=================================");
    }
}