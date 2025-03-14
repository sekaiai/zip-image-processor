# ComicPress - 漫画压缩优化工具

![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 项目背景

为解决漫画文件体积过大导致的手机存储占用和WebDAV传输缓慢问题，我们开发了ComicPress。本工具能够自动解压漫画压缩包，智能优化图片尺寸和质量，并重新打包为高压缩比格式，帮助您：

- 📦 节省手机存储空间（最高可缩减至原体积的30%）
- ⚡ 提升WebDAV传输速度
- 📱 优化移动端阅读体验
- 🔄 保持原始文件目录结构

## 核心功能

### ✨ 智能处理流程
1. **自动解压**：支持 ZIP/RAR
2. **并行处理**：多线程图片优化
3. **图像优化**：
   - 分辨率自动适配（默认850px宽）
   - 格式转换（WebP/JPEG/PNG）
   - 质量压缩
4. **智能打包**：输出ZIP格式文件
5. **文件管理**：自动归档原始文件

## 快速开始

### 前置要求
- Node.js 16+ 

### 安装步骤
```bash
# 克隆项目
git clone https://github.com/sekaiai/zip-image-processor.git

# 安装依赖
cd cd zip-image-processor
npm install
```

### 使用指南
```bash
npm run start
```
跟随命令行提示配置参数：
```
√ 输入源文件夹路径 · ./input     # 存放原始漫画压缩包
√ 输出文件夹路径 · ./output      # 保存优化后的文件
√ 完成文件夹路径 · ./completed  # 处理完成的原始文件
√ 选择输出格式 · webp           # [webp/jpg/png]
√ ZIP处理线程数 (1-12) · 1      # 推荐低频CPU使用1线程
√ 图片处理线程数 (1-12) · 11    # 推荐留1个CPU核心
√ 最大图片宽度 · 850            # 手机阅读推荐尺寸
√ 输出质量 (30-100) · 70       # 平衡质量与体积
```

## 常见问题

### Q: 处理速度慢怎么办？
A: 尝试调整线程配置：
- 使用默认配置
- 适当减少线程数

### Q: 如何保留原始文件？
A: 确保`completed`目录配置正确，工具处理完成后会自动移动原始文件

### Q: 支持哪些压缩格式？
A: 输入支持：ZIP/RAR，输出固定为ZIP格式


本项目采用 [MIT License](LICENSE)，可自由用于个人和商业用途。使用本工具处理他人作品时请遵守相关著作权法规。