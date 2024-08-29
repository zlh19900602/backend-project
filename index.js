const express = require('express');
const mysql = require('mysql2');

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

// 插入用户信息的接口
app.post('/insert-user', (req, res) => {
  const { userName, uName, gender, mobile, state } = req.body;

  // 检查是否缺少必填字段
  if (!userName || !uName || !gender || !mobile || !state) {
    return res.status(400).json({ message: '缺少必要字段' });
  }

  // 插入用户信息的 SQL 语句
  const sql = `INSERT INTO user (userName, uName, gender, mobile, state, createTime, updateTime) 
               VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;

  // 执行插入操作
  db.query(sql, [userName, uName, gender, mobile, state], (err, result) => {
    if (err) {
      console.error('插入数据失败:', err);
      return res.status(500).json({ message: '插入数据失败' });
    }
    res.status(200).json({ message: '用户信息插入成功', userId: result.insertId });
  });
});

// 监听端口
app.listen(8088, () => {
  console.log('服务器运行在 http://localhost:8088');
});
