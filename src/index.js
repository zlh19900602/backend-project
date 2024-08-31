const express = require('express');
const mysql = require('mysql2');
const userRoutes = require('./userRoutes'); 

// 创建 Express 应用
const app = express();

// 使用中间件解析 JSON 请求体
app.use(express.json());

// 创建数据库连接
const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'demo'
});

// 连接到数据库
db.connect((err) => {
  if (err) {
    console.error('连接数据库失败:', err);
  } else {
    console.log('成功连接到数据库');
  }
});

// 将数据库连接对象db挂载到app对象上
app.set('db', db);

// 使用用户相关路由
app.use('/users', (req, res, next) => {
  req.db = app.get("db");
  next()
}, userRoutes);

// 监听端口
app.listen(8088, () => {
  console.log('服务器运行在 http://localhost:8088');
});
