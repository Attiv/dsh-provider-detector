#!/bin/bash

# DSH Provider Detector 安装脚本

set -e

echo "🚀 开始安装 DSH Provider Detector..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 dsh-provider-detector 目录下运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 构建完成！"

# 检查构建结果
if [ -d "lib" ]; then
    echo "✅ lib 目录创建成功"
    echo "📁 生成的文件:"
    ls -lh lib/
else
    echo "❌ 构建失败: lib 目录未创建"
    exit 1
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "下一步:"
echo "1. 将此插件链接到你的 DSH 配置中"
echo "2. 或者发布到 npm: npm publish"
echo ""
echo "使用方法:"
echo "在 DSH 配置文件中添加:"
echo ""
echo "plugins:"
echo "  './path/to/dsh-provider-detector': {}"
echo ""
echo "或者使用 npm link 进行本地测试:"
echo "npm link"
echo ""
