@echo off
chcp 65001 >nul
pushd "%~dp0.."
call npm run build
if errorlevel 1 (
  echo.
  echo 图片更新未完成。请按上面的提示检查文件名、格式或缺失图片。
) else (
  echo.
  echo 图片已更新，请刷新本地网页。此操作没有上传或发布网站。
)
popd
pause
