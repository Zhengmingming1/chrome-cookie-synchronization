// 生成Chrome扩展图标的Node.js脚本
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4285F4');
    gradient.addColorStop(1, '#1565C0');
    
    // 绘制圆形背景
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制Cookie
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(size * 0.4, size * 0.4, size * 0.15, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制Cookie上的点
    ctx.fillStyle = '#D4AF37';
    ctx.globalAlpha = 1;
    const dotSize = size * 0.02;
    
    // 多个装饰点
    const dots = [
        {x: 0.35, y: 0.35, size: 1},
        {x: 0.42, y: 0.38, size: 0.8},
        {x: 0.38, y: 0.43, size: 0.8},
        {x: 0.44, y: 0.42, size: 1}
    ];
    
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(size * dot.x, size * dot.y, dotSize * dot.size, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // 绘制云图标
    const cloudGradient = ctx.createLinearGradient(size * 0.6, size * 0.5, size * 0.9, size * 0.8);
    cloudGradient.addColorStop(0, '#34A853');
    cloudGradient.addColorStop(1, '#2E7D32');
    
    ctx.fillStyle = cloudGradient;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(size * 0.75, size * 0.65, size * 0.12, size * 0.08, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制同步箭头
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 1;
    
    // 上箭头
    ctx.beginPath();
    ctx.moveTo(size * 0.72, size * 0.62);
    ctx.lineTo(size * 0.75, size * 0.59);
    ctx.lineTo(size * 0.78, size * 0.62);
    ctx.lineTo(size * 0.76, size * 0.62);
    ctx.lineTo(size * 0.76, size * 0.65);
    ctx.lineTo(size * 0.74, size * 0.65);
    ctx.lineTo(size * 0.74, size * 0.62);
    ctx.closePath();
    ctx.fill();
    
    // 下箭头
    ctx.beginPath();
    ctx.moveTo(size * 0.78, size * 0.68);
    ctx.lineTo(size * 0.75, size * 0.71);
    ctx.lineTo(size * 0.72, size * 0.68);
    ctx.lineTo(size * 0.74, size * 0.68);
    ctx.lineTo(size * 0.74, size * 0.65);
    ctx.lineTo(size * 0.76, size * 0.65);
    ctx.lineTo(size * 0.76, size * 0.68);
    ctx.closePath();
    ctx.fill();
    
    // 装饰性光点
    ctx.fillStyle = '#FFF';
    const highlights = [
        {x: 0.23, y: 0.23, size: 0.023, alpha: 0.6},
        {x: 0.74, y: 0.27, size: 0.015, alpha: 0.4},
        {x: 0.19, y: 0.70, size: 0.019, alpha: 0.5},
        {x: 0.78, y: 0.74, size: 0.015, alpha: 0.3}
    ];
    
    highlights.forEach(highlight => {
        ctx.globalAlpha = highlight.alpha;
        ctx.beginPath();
        ctx.arc(size * highlight.x, size * highlight.y, size * highlight.size, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    return canvas;
}

// 生成所有尺寸的图标
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
    try {
        const canvas = createIcon(size);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`assets/icon${size}.png`, buffer);
        console.log(`✅ 生成 icon${size}.png 成功`);
    } catch (error) {
        console.error(`❌ 生成 icon${size}.png 失败:`, error.message);
    }
});

console.log('🎉 图标生成完成！');