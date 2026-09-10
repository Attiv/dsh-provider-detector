#!/bin/bash

echo "🔄 重启 DSH 以加载 Provider Detector 插件..."

# 查找并停止 DSH 进程
echo "📍 查找 DSH 进程..."
DSH_PIDS=$(ps aux | grep "[d]sh.*web" | awk '{print $2}')

if [ -z "$DSH_PIDS" ]; then
    echo "✅ DSH 未运行"
else
    echo "🛑 停止 DSH 进程: $DSH_PIDS"
    echo "$DSH_PIDS" | xargs kill
    sleep 2
    
    # 确保停止
    DSH_PIDS=$(ps aux | grep "[d]sh.*web" | awk '{print $2}')
    if [ ! -z "$DSH_PIDS" ]; then
        echo "⚠️  强制停止..."
        echo "$DSH_PIDS" | xargs kill -9
        sleep 1
    fi
fi

echo "✅ DSH 已停止"
echo ""
echo "现在请通过以下方式之一重启 DSH:"
echo ""
echo "方式 1: 使用桌面应用"
echo "  打开 DeepSeek Harness.app"
echo ""
echo "方式 2: 使用命令行"
echo "  dsh --profile web"
echo ""
echo "启动后检查日志应该看到:"
echo "  [info] Provider Detector plugin loaded"
echo "  [info] Provider Detector API routes registered"
echo ""
echo "然后测试 API:"
echo "  curl http://localhost:3080/api/provider-detector/providers"
echo ""
