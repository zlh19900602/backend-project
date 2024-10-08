const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const router = express.Router();

const JWT_SECRET = "lg_jwt_secret_key";

// 生成一个带有 "U" 开头的10位不重复数的函数
const generateUserId = () => {
  const timestamp = Date.now().toString(); // 获取当前时间戳
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // 生成3位随机数
  const userId = `U${timestamp.slice(-7)}${randomDigits}`; // 最终生成的10位数
  return userId;
};

// 登录接口
router.post("/login", (req, res) => {
  const { userName, password } = req.body;
  if (!userName || !password) {
    return res.status(400).json({ message: "缺少用户名或密码" });
  }

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db
  const sql = `SELECT * FROM user WHERE userName = ?`;

  db.query(sql, [userName], async (err, result) => {
    if (err) {
      console.error("登录查询失败:", err);
      return res.status(500).json({ message: "登录查询失败" });
    }
    if (result.length === 0) {
      return res.status(400).json({ message: "用户名或密码错误" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "用户名或密码错误" });
    }

    // 生成JWT
    const token = jwt.sign({ userId: user.userId}, JWT_SECRET, { expiresIn: "1h" });
    console.log(user, 'useruser')
    res.status(200).json({ code: '0', message: "登录成功", info: {
      token, userId: user.userId, userName: user.userName, uName: user.uName, mobile: user.mobile
    }});
  })
})

// 更新用户密码接口
router.post("/updatePassword", async (req, res) => {
  const {userId, oldPwd, newPwd } = req.body;
  if (!userId || !oldPwd || !newPwd) {
    return res.status(400).json({ message: "缺少必要字段" });
  }

  const db = req.db; // 从 req 对象中获取 db
  // 从数据库中获取用户信息
  const sql = `SELECT * FROM user WHERE userId = ?`;
  db.query(sql, [userId], async (err, result) => {
    if (err) {
      console.error('查询用户信息失败：', err);
      return res.status(500).json({ message: '查询用户信息失败'});
    }
    
    if (result.length === 0) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const user = result[0];
    // 验证旧密码是否正确
    const isMatch = await bcrypt.compare(oldPwd, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '旧密码错误' });
    }
    // 使用 bcrypt 哈希加密新密码
    const hashedPassword = await bcrypt.hash(newPwd, 10);

    // 更新数据库中的密码
    const sql = `UPDATE user SET password = ? WHERE userId = ?`;
    db.query(sql, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error('更新密码失败:', err);
        return res.status(500).json({ message: '更新密码失败' });
      }
      res.status(200).json({ code: '0', message: '密码更新成功' });
    })
  })
})

// 重置用户密码为123456接口
router.post("/resetUserPassword", async (req, res) => {
  const {userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "缺少必要字段" });
  }

  const db = req.db; // 从 req 对象中获取 db
  // 从数据库中获取用户信息
  const sql = `SELECT * FROM user WHERE userId = ?`;
  db.query(sql, [userId], async (err, result) => {
    if (err) {
      console.error('查询用户信息失败：', err);
      return res.status(500).json({ message: '查询用户信息失败'});
    }
    
    if (result.length === 0) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const defaultPassword = "123456";
    // 使用 bcrypt 哈希加密新密码
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 重置数据库中的密码
    const sql = `UPDATE user SET password = ? WHERE userId = ?`;
    db.query(sql, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error('密码重置失败:', err);
        return res.status(500).json({ message: '密码重置失败' });
      }
      res.status(200).json({ code: '0', message: '密码重置成功' });
    })
  })
})

// 插入用户信息的接口
router.post("/insertUser", async (req, res) => {
  const { userName, uName, gender, mobile, state } = req.body;

  // 检查是否缺少必填字段
  if (!userName || !uName || !gender || !mobile || !state) {
    return res.status(400).json({ message: "缺少必要字段" });
  }

  // 生成唯一的userId
  const userId = generateUserId();
  // 对密码进行哈希处理
  const defaultPassword = "123456";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db

  // 插入用户信息的 SQL 语句
  const sql = `INSERT INTO user (userId, userName, uName, gender, mobile, state, password, createTime, updateTime) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

  // 执行插入操作
  db.query(
    sql,
    [userId, userName, uName, gender, mobile, state, hashedPassword],
    (err, result) => {
      if (err) {
        console.error("插入数据失败:", err);
        return res.status(500).json({ message: "插入数据失败" });
      }
      res
        .status(200)
        .json({ message: "用户信息插入成功", userId: result.insertId });
    }
  );
});

// 查询用户信息接口
router.post("/queryUser", (req, res) => {
  const { userName, mobile, state } = req.body;
  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db

  // 查询所有用户的SQL语句
  let sql = `SELECT * FROM user WHERE 1=1`;
  const params = [];

  if (userName) {
    sql += ` AND userName LIKE ?`;
    params.push(`%${userName}%`); // 模糊查询
  }
  if (mobile) {
    sql += ` AND mobile LIKE ?`;
    params.push(`%${mobile}%`); // 模糊查询
  }
  if (state) {
    sql += ` AND state LIKE ?`;
    params.push(`%${state}%`); // 模糊查询
  }

  // 执行查询操作
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("查询用户列表失败:", err);
      return res.status(500).json({ message: "查询用户列表失败" });
    }

    // 格式化返回结果中的时间字段
    const formattedResult = result.map((user) => {
      return {
        ...user,
        createTime: moment(user.createTime).format("YYYY-MM-DD HH:mm:ss"),
        updateTime: moment(user.updateTime).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    res.status(200).json(formattedResult);
  });
});

// 根据userId查询用户信息接口
router.post("/queryUserById", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "缺少userId参数" });
  }

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db

  // 查询用户信息的sql语句
  const sql = `SELECT * FROM user WHERE userId = ?`;

  // 执行查询操作
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("查询用户信息失败:", err);
      return res.status(500).json({ message: "查询用户信息失败" });
    }
    if (result.length === 0) {
      return res.status(500).json({ message: "未找到对应的用户" });
    }
    // 格式化返回结果中的时间字段
    const user = result[0];
    user.createTime = moment(user.createTime).format("YYYY-MM-DD HH:mm:ss");
    user.updateTime = moment(user.updateTime).format("YYYY-MM-DD HH:mm:ss");

    res.status(200).json(user);
  });
});

// 根据userId修改用户为禁用状态接口
router.post("/updateStateForbiddenById", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "缺少userId参数" });
  }

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db
  
  // 查询用户信息的sql语句
  const sql = `update user set state=2 where userId = ?`;

  // 执行查询操作
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("用户禁用状态修改失败:", err);
      return res.status(500).json({ message: "用户禁用状态修改失败" });
    }
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "未找到对应的用户" });
    }

    res.status(200).json({ code: '0', message: "状态更改成功" });
  });
});

// 根据userId修改用户为注销状态接口
router.post("/updateStateLogoutById", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "缺少userId参数" });
  }

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db
  
  // 查询用户信息的sql语句
  const sql = `update user set state='0' where userId = ?`;

  // 执行查询操作
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("用户注销状态修改失败:", err);
      return res.status(500).json({ message: "用户注销状态修改失败" });
    }
    if (result.affectedRows  === 0) {
      return res.status(500).json({ message: "未找到对应的用户" });
    }

    res.status(200).json({ code: '0', message: "状态更改成功" });
  });
});

// 根据userId修改用户信息接口
router.post("/updateUserInfoById", (req, res) => {
  const { userId, userName, uName, gender, mobile, state } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "缺少userId参数" });
  }

  // 获取数据库连接对象
  const db = req.db; // 从 req 对象中获取 db
  
  // 查询用户信息的sql语句
  const sql = `UPDATE user set userName = ?, uName = ?, gender = ?, mobile = ?, state = ? WHERE userId = ?`;

  // 执行查询操作
  db.query(sql, [userName, uName, gender, mobile, state, userId], (err, result) => {
    if (err) {
      console.error("用户信息修改失败:", err);
      return res.status(500).json({ message: "用户信息修改失败" });
    }
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "未找到对应的用户" });
    }

    res.status(200).json({ code: '0', message: "用户信息更新成功" });
  });
});

module.exports = router;