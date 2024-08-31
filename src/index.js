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

// // 插入用户信息的接口
// app.post('/insertUser', (req, res) => {
//   const { userName, uName, gender, mobile, state } = req.body;

//   // 检查是否缺少必填字段
//   if (!userName || !uName || !gender || !mobile || !state) {
//     return res.status(400).json({ message: '缺少必要字段' });
//   }

//   // 生成唯一的userId
//   const userId = generateUserId();

//   // 插入用户信息的 SQL 语句
//   const sql = `INSERT INTO user (userId, userName, uName, gender, mobile, state, createTime, updateTime) 
//                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

//   // 执行插入操作
//   db.query(sql, [userId, userName, uName, gender, mobile, state], (err, result) => {
//     if (err) {
//       console.error('插入数据失败:', err);
//       return res.status(500).json({ message: '插入数据失败' });
//     }
//     res.status(200).json({ message: '用户信息插入成功', userId: result.insertId });
//   });
// });

// // 查询用户信息接口
// app.post('/queryUser', (req, res) => {
//   // 查询所有用户的SQL语句
//   const sql = `SELECT * FROM user`;

//   // 执行查询操作
//   db.query(sql, (err, result) => {
//     if (err) {
//       console.error('查询用户列表失败:', err);
//       return res.status(500).json({ message: '查询用户列表失败' });
//     }

//     // 格式化返回结果中的时间字段
//     const formattedResult = result.map(user => {
//       return {
//         ...user,
//         createTime: moment(user.createTime).format('YYYY-MM-DD HH:mm:ss'),
//         updateTime: moment(user.updateTime).format('YYYY-MM-DD HH:mm:ss'),
//       }
//     })
//     res.status(200).json(formattedResult)
//   })
// })

// // 根据userId查询用户信息接口
// app.post('/queryUserById', (req, res) => {
//   const { userId } = req.body;
//   if (!userId) {
//     return res.status(400).json({ message: '缺少userId参数' });
//   }

//   // 查询用户信息的sql语句
//   const sql = `SELECT * FROM user WHERE userId = ?`;

//   // 执行查询操作
//   db.query(sql, [userId], (err, result) => {
//     if (err) {
//       console.error('查询用户信息失败:', err);
//       return res.status(500).json({ message: '查询用户信息失败' });
//     }
//     if (result.length === 0) {
//       return res.status(500).json({ message: '未找到对应的用户' });
//     }
//     // 格式化返回结果中的时间字段
//     const user = result[0];
//     user.createTime = moment(user.createTime).format('YYYY-MM-DD HH:mm:ss');
//     user.updateTime = moment(user.updateTime).format('YYYY-MM-DD HH:mm:ss');

//     res.status(200).json(user);
//   })
// })

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
