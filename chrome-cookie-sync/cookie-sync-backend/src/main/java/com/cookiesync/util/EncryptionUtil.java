package com.cookiesync.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES加密解密工具类
 * 使用AES-256-GCM模式，提供更高的安全性
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Slf4j
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;

    @Value("${cookie-sync.security.encryption.key:CookieSyncSecretKey2024!@#$%^&*}")
    private String secretKey;

    /**
     * 生成AES密钥
     */
    public static String generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(256);
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("生成AES密钥失败", e);
        }
    }

    /**
     * 加密数据
     * 
     * @param plainText 明文
     * @return 加密后的Base64字符串
     */
    public String encrypt(String plainText) {
        try {
            // 生成密钥
            SecretKeySpec keySpec = new SecretKeySpec(getKeyBytes(), ALGORITHM);
            
            // 生成随机IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            
            // 初始化加密器
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmParameterSpec);
            
            // 加密数据
            byte[] encryptedData = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // 将IV和加密数据合并
            byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encryptedData.length];
            System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedData, 0, encryptedWithIv, GCM_IV_LENGTH, encryptedData.length);
            
            return Base64.getEncoder().encodeToString(encryptedWithIv);
            
        } catch (Exception e) {
            log.error("数据加密失败", e);
            throw new RuntimeException("数据加密失败", e);
        }
    }

    /**
     * 解密数据
     * 
     * @param encryptedText 加密的Base64字符串
     * @return 解密后的明文
     */
    public String decrypt(String encryptedText) {
        try {
            // 解码Base64
            byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);
            
            // 提取IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(encryptedWithIv, 0, iv, 0, GCM_IV_LENGTH);
            
            // 提取加密数据
            byte[] encryptedData = new byte[encryptedWithIv.length - GCM_IV_LENGTH];
            System.arraycopy(encryptedWithIv, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);
            
            // 生成密钥
            SecretKeySpec keySpec = new SecretKeySpec(getKeyBytes(), ALGORITHM);
            
            // 初始化解密器
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmParameterSpec);
            
            // 解密数据
            byte[] decryptedData = cipher.doFinal(encryptedData);
            
            return new String(decryptedData, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            log.error("数据解密失败", e);
            throw new RuntimeException("数据解密失败", e);
        }
    }

    /**
     * 获取密钥字节数组
     */
    private byte[] getKeyBytes() {
        try {
            // 如果密钥长度不足32字节，进行填充
            String key = secretKey;
            if (key.length() < 32) {
                key = String.format("%-32s", key).replace(' ', '0');
            } else if (key.length() > 32) {
                key = key.substring(0, 32);
            }
            
            return key.getBytes(StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new RuntimeException("密钥处理失败", e);
        }
    }

    /**
     * 验证加密解密功能
     */
    public boolean validateEncryption() {
        try {
            String testData = "测试数据Test Data 123!@#";
            String encrypted = encrypt(testData);
            String decrypted = decrypt(encrypted);
            
            boolean isValid = testData.equals(decrypted);
            log.info("加密解密验证结果: {}", isValid ? "通过" : "失败");
            
            return isValid;
            
        } catch (Exception e) {
            log.error("加密解密验证失败", e);
            return false;
        }
    }
}