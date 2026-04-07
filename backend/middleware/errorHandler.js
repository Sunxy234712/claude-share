// 统一错误处理中间件
function errorHandler(err, req, res, next) {
  console.error(`[错误] ${req.method} ${req.path}:`, err.message)
  res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' })
}

module.exports = errorHandler
