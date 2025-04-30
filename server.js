
// // server.js
// const express = require('express');
// const mysql = require('mysql2/promise');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const path = require('path');
// const multer = require('multer');
// const fs = require('fs');
// const app = express();
// const port = process.env.PORT || 5000;
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');

// const SECRET_KEY = 'hv546JHfgjjm';
// const SALT_ROUNDS = 10;
// // MySQL Connection
// const dbConfig = {
//   host: 'localhost',
//   user: 'root',
//   port: 3306,
//   password: 'root',
//   database: 'kachiwala_db', // Ensure this database exists in your MySQL server
// };

// // Middleware
// const CorsBody = {
//   origin: '*',
// };
// app.use(cors(CorsBody));
// app.use(bodyParser.json({ limit: '100gb' }));
// app.use(bodyParser.urlencoded({ limit: '100gb', extended: true }));
// app.use(express.json({ limit: '100gb' }));
// app.use(express.urlencoded({ limit: '100gb', extended: true }));

// const baseFolder = path.join(__dirname, 'imageData');
// let folderIndex = 1;

// const getTargetFolder = () => {
//   const folderPath = path.join(baseFolder, `folder${folderIndex}`);
//   if (!fs.existsSync(folderPath)) {
//     fs.mkdirSync(folderPath, { recursive: true });
//   }

//   const files = fs.readdirSync(folderPath);
//   if (files.length >= 200) {
//     folderIndex += 1;
//     return getTargetFolder(); // Recursive call to get a new folder if the current one exceeds 200 files
//   }
//   return folderPath;
// };

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const folder = getTargetFolder();
//     cb(null, folder);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueSuffix);
//   },
// });

// const upload = multer({ storage });

// app.use('/imageData', express.static(path.join(__dirname, 'imageData')));

// // Initialize Database Table
// (async () => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS product (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         type VARCHAR(255),
//         code VARCHAR(255),
//         designNo VARCHAR(255),
//         name VARCHAR(255),
//         description TEXT,
//         size VARCHAR(255),
//         color VARCHAR(255),
//         packing VARCHAR(255),
//         rate INT,
//         image LONGTEXT   ,
//         meter FLOAT
//       )
//     `);
//     console.log('Database and table initialized');
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         name VARCHAR(100) NOT NULL,
//         email VARCHAR(255) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         role VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
//     await connection.end();
//   } catch (error) {
//     console.error('Error initializing database:', error);
//   }
// })();

// // Routes
// // code
// // description
// const authenticateToken = (req, res, next) => {
//   const token = req.header('Authorization');

//   if (!token) {
//     return res.status(401).json({ error: 'Access denied. No token provided.' });
//   }

//   try {
//     const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
//     req.user = decoded; // Attach user info to request
//     next();
//   } catch (error) {
//     return res.status(403).json({ error: 'Invalid or expired token' });
//   }
// };
// // sign up  add user
// app.post('/api/add-user',authenticateToken, async (req, res) => {
//   const { name, email, password ,role} = req.body;

//   if (!name || !email || !password) {
//     return res.status(400).json({ error: 'All fields (name, email, password) are required' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Check if the email already exists
//     const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
//     if (existingUser.length > 0) {
//       await connection.end();
//       return res.status(400).json({ error: 'Email already in use' });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

//     // Insert the new user into the database
//     const [result] = await connection.query(
//       'INSERT INTO users (name, email, password,role) VALUES (?, ?, ?, ?)',
//       [name, email, hashedPassword,role]
//     );

//     await connection.end();

//     // Generate JWT token
//     // const token = jwt.sign({ id: result.insertId, email }, SECRET_KEY, { expiresIn: '1h' });

//     res.status(201).json({ message: 'User registered successfully'});

//   } catch (error) {
//     console.error('Signup error:', error);
//     res.status(500).json({ error: 'Signup failed', details: error.message });
//   }
// });
// // update user 
// app.put('/api/users/:id',authenticateToken, async (req, res) => {
//   const { id } = req.params;
//   const { name, email } = req.body;

//   if (!name || !email) {
//     return res.status(400).json({ error: 'Name and email are required' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Check if the new email is already taken by another user
//     const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
//     if (existingUser.length > 0) {
//       await connection.end();
//       return res.status(400).json({ error: 'Email is already in use' });
//     }

//     // Update user
//     const [result] = await connection.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);

//     await connection.end();

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({ message: 'User updated successfully' });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ error: 'Failed to update user', details: error.message });
//   }
// });
// // delete users 
// app.delete('/api/users/delete', authenticateToken , async (req, res) => {
//   const { ids } = req.body;

//   if (!Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json({ error: 'Array of user IDs is required' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Delete users where ID is in the provided list
//     const [result] = await connection.query('DELETE FROM users WHERE id IN (?)', [ids]);

//     await connection.end();

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'No matching users found' });
//     }

//     res.status(200).json({ message: 'Users deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting users:', error);
//     res.status(500).json({ error: 'Failed to delete users', details: error.message });
//   }
// });

// // change password
// app.put('/api/users/:id/password',authenticateToken, async (req, res) => {
//   const { id } = req.params;
//   const { currentPassword, newPassword } = req.body;

//   if (!currentPassword || !newPassword) {
//     return res.status(400).json({ error: 'Current and new password are required' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Fetch user's current hashed password
//     const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [id]);
//     if (users.length === 0) {
//       await connection.end();
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const user = users[0];

//     // Compare current password with stored hash
//     const isMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isMatch) {
//       await connection.end();
//       return res.status(401).json({ error: 'Current password is incorrect' });
//     }

//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     const [result] = await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

//     await connection.end();

//     res.status(200).json({ message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Error updating password:', error);
//     res.status(500).json({ error: 'Failed to update password', details: error.message });
//   }
// });
// // get all users 
// app.get('/api/users',authenticateToken, async (req, res) => {
//   const { search = '', take = 10, skip = 0 } = req.query;

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     const query = `
//       SELECT id, name, email, created_at 
//       FROM users 
//       WHERE name LIKE ? OR email LIKE ? 
//       LIMIT ? OFFSET ?`;

//     const [users] = await connection.query(query, [`%${search}%`, `%${search}%`, Number(take), Number(skip)]);

//     await connection.end();
    
//     res.status(200).json({ users });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ error: 'Failed to fetch users', details: error.message });
//   }
// });
// // login

// app.post('/api/login', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Fetch user from database
//     const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
//     await connection.end();
//     // console.log(rows);
//     if (rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid email or password' });
//     }

//     const user = rows[0];

//     // Here, you should use bcrypt to compare hashed passwords (if stored hashed)
//     const passwordMatch = await bcrypt.compare(password, user.password);
//     if (!passwordMatch) {
//       return res.status(401).json({ error: 'Wrong password' });
//     }
    
//     // if (password !== user.password) {
//     //   return res.status(401).json({ error: 'Wrong password' });
//     // }

//     // Generate JWT Token
//     const token = jwt.sign(
//       { id: user.id, email: user.email, role: user.role },
//       SECRET_KEY,
//       { expiresIn: '3d' } // Token expires in 1 hour
//     );

//     res.status(200).json({ message: 'Login successful', token, userId: user.id, role: user.role });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Login failed', details: error.message });
//   }
// });

// app.post('/api/product', upload.array('images', 11), authenticateToken,async (req, res) => {
//   console.log('Received product data');
//   const { type, code, designNo, name, description, size, color, packing, rate, meter, person } = req.body;

//   // Save file paths to the database
//   const imagePaths = req.files.map(file =>{
    
//     const relativePath =  path.relative(__dirname, file.path);
//     return relativePath.replace(/\\/g, '/');
  
//   } );
// console.log(imagePaths);
// console.log(__dirname);
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     const [result] = await connection.query(
//       `INSERT INTO product (type, code, designNo, name, description, size, color, packing, rate, image , meter, person )
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)`,
//       [type, code, designNo, name, description, size, color, packing, rate, JSON.stringify(imagePaths), meter, person]
//     );
//     await connection.end();
//     res.status(201).json({
//       success: true,
//       product: { id: result.insertId, ...req.body, imagePaths },
//     });
//   } catch (error) {
//     console.error('Error adding product:', error);
//     res.status(500).json({ error: 'Failed to add product', details: error.message });
//   }
// });

// app.get('/api/products/test',authenticateToken , async (req, res) => {
//   const { search, take, skip } = req.query; // Use req.query for GET requests
//   const limit = take ? parseInt(take) : 100 ; // Default to 10 if take is not provided
//   const offset = skip ? parseInt(skip) : 0; // Default to 0 if skip is not provided

//   let searchQuery = '';
//   let searchParams = [];

//   // If search term is provided, add it to the WHERE clause
//   if (search && search.trim()) {
//     // Construct a dynamic WHERE clause that searches across all columns
//     searchQuery = `
//       WHERE type LIKE ? OR
//             code LIKE ? OR
//             designNo LIKE ? OR
//             name LIKE ? OR
//             description LIKE ? OR
//             size LIKE ? OR
//             color LIKE ? OR
//             packing LIKE ? OR
//             rate LIKE ? 
//             meter LIKE ? 
//     `;

//     // Prepare the search parameters, using the search term for all columns
//     const searchTerm = `%${search}%`;
//     searchParams = new Array(9).fill(searchTerm);  // We have 10 columns to search
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     const query = `
//       SELECT * FROM product
//       ${searchQuery}
//       LIMIT ${limit} OFFSET ${offset}  -- Directly insert limit and offset values
//     `;

//     const params = [...searchParams]; 

//     const [products] = await connection.execute(query, params);
//     console.log("products :- ",products);
//     const baseUrl = `http://103.251.16.248:5000`; // Adjust to your server's base URL
//     const productsWithUrls = products.map(product => ({
//       ...product,
//       imagePaths: JSON.parse(product.image).map(image => `${baseUrl}/${image}`)
//     }));
//     await connection.end();

//     // res.json(products);

//     res.json(productsWithUrls);
//     } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).send('Error fetching products');
//   }
// });

// app.put('/api/product/:id', upload.array('images', 11),authenticateToken, async (req, res) => {
//   console.log('Updating product data');
//   const { id } = req.params;
//   const { type, designNo, name, size, color, packing, rate, meter, person } = req.body;
//   let imagePaths = [];

//   if (req.files && req.files.length > 0) {
//     imagePaths = req.files.map(file => {
//       const relativePath = path.relative(__dirname, file.path);
//       return relativePath.replace(/\\/g, '/');
//     });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);
    
//     // Fetch existing images if no new images are uploaded
//     if (imagePaths.length === 0) {
//       const [rows] = await connection.query(
//         'SELECT image FROM product WHERE id = ?',
//         [id]
//       );
//       if (rows.length > 0) {
//         imagePaths = JSON.parse(rows[0].image);
//       }
//     }

//     const [result] = await connection.query(
//       `UPDATE product 
//        SET type = ?, code = ?, designNo = ?, name = ?, description = ?, size = ?, color = ?, packing = ?, rate = ?, image = ?, meter = ?, person = ?
//        WHERE id = ?`,
//       [type, '', designNo, name, '', size, color, packing, rate, JSON.stringify(imagePaths), meter, person, id]
//     );

//     await connection.end();

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Product not found' });
//     }

//     res.status(200).json({
//       success: true,
//       product: { id, type, code: '', designNo, name, description: '', size, color, packing, rate, imagePaths, meter, person },
//     });
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(500).json({ error: 'Failed to update product', details: error.message });
//   }
// });
// // delete product 
// app.delete('/api/delete',authenticateToken, async (req, res) => {
//   const { ids } = req.body; 

//   if (!Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json({ error: 'IDs array is required and cannot be empty' });
//   }

//   try {
//     const connection = await mysql.createConnection(dbConfig);
    
//     const placeholders = ids.map(() => '?').join(',');
//     const query = `DELETE FROM product WHERE id IN (${placeholders})`;

//     const [result] = await connection.query(query, ids);

//     await connection.end();

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'No matching records found' });
//     }

//     res.status(200).json({ message: 'Records deleted successfully' });

//   } catch (error) {
//     console.error('Error deleting records:', error);
//     res.status(500).json({ error: 'Failed to delete products', details: error.message });
//   }
// });

// const Host = 'localhost';
// app.listen(port, () => console.log(`Server running on http://${Host}:${port}`));


// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET_KEY = 'hv546JHfgjjm';
const SALT_ROUNDS = 10;
// MySQL Connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: 'root',
  database: 'kachiwala_db', // Ensure this database exists in your MySQL server
};

// Middleware
const CorsBody = {
  origin: '*',
};
app.use(cors(CorsBody));
app.use(bodyParser.json({ limit: '100gb' }));
app.use(bodyParser.urlencoded({ limit: '100gb', extended: true }));
app.use(express.json({ limit: '100gb' }));
app.use(express.urlencoded({ limit: '100gb', extended: true }));

const baseFolder = path.join(__dirname, 'imageData');
let folderIndex = 1;

const getTargetFolder = () => {
  const folderPath = path.join(baseFolder, `folder${folderIndex}`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const files = fs.readdirSync(folderPath);
  if (files.length >= 200) {
    folderIndex += 1;
    return getTargetFolder(); // Recursive call to get a new folder if the current one exceeds 200 files
  }
  return folderPath;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getTargetFolder();
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

app.use('/imageData', express.static(path.join(__dirname, 'imageData')));

// Initialize Database Table
(async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255),
        code VARCHAR(255),
        designNo VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        size VARCHAR(255),
        color VARCHAR(255),
        packing VARCHAR(255),
        rate INT,
        image LONGTEXT   ,
        meter FLOAT
      )
    `);
    console.log('Database and table initialized');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
})();

// Routes
// code
// description
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// sign up  add user
app.post('/api/add-user',authenticateToken, async (req, res) => {
  const { name, email, password ,role} = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Check if the email already exists
    const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash the password
    // const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert the new user into the database
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password,role) VALUES (?, ?, ?, ?)',
      [name, email, password,role]
    );

    await connection.end();

    // Generate JWT token
    // const token = jwt.sign({ id: result.insertId, email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully'});

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', details: error.message });
  }
});

// update user 
app.put('/api/users/:id',authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  console.log("PASSWORD: ", password);
  

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name and email and Password are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Check if the new email is already taken by another user
    const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Update user
    const [result] = await connection.query('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, password, id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// delete users 
app.delete('/api/users/delete', authenticateToken , async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of user IDs is required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Delete users where ID is in the provided list
    const [result] = await connection.query('DELETE FROM users WHERE id IN (?)', [ids]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No matching users found' });
    }

    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users', details: error.message });
  }
});

// change password
app.put('/api/users/:id/password',authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch user's current hashed password
    const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Compare current password with stored hash
    // const isMatch = await bcrypt.compare(currentPassword, user.password);
    // if (!isMatch) {
    //   await connection.end();
    //   return res.status(401).json({ error: 'Current password is incorrect' });
    // }

    // // Hash the new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [result] = await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);

    await connection.end();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});


// get all users 
app.get('/api/users',authenticateToken, async (req, res) => {
  const { search = '', take = 10, skip = 0 } = req.query;

  try {
    const connection = await mysql.createConnection(dbConfig);
   

    const query = `
      SELECT id, name, email, password, created_at 
      FROM users 
      WHERE name LIKE ? OR email LIKE ? 
      LIMIT ? OFFSET ?`;

    const [users] = await connection.query(query, [`%${search}%`, `%${search}%`, Number(take), Number(skip)]);

    await connection.end();
    
    res.status(200).json({ users});
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch user from database
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    await connection.end();
    // console.log(rows);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Here, you should use bcrypt to compare hashed passwords (if stored hashed)
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ error: 'Wrong password' });
    // }
    
    if (password !== user.password) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '3d' } // Token expires in 1 hour
    );

    res.status(200).json({ message: 'Login successful', token, userId: user.id, role: user.role });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/api/product', upload.array('images', 11), authenticateToken,async (req, res) => {
  console.log('Received product data');
  const { type, code, designNo, name, description, size, color, packing, rate, meter, person } = req.body;

  // Save file paths to the database
  const imagePaths = req.files.map(file =>{
    
    const relativePath =  path.relative(__dirname, file.path);
    return relativePath.replace(/\\/g, '/');
  
  } );
console.log(imagePaths);
console.log(__dirname);
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query(
      `INSERT INTO product (type, code, designNo, name, description, size, color, packing, rate, image , meter, person )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)`,
      [type, code, designNo, name, description, size, color, packing, rate, JSON.stringify(imagePaths), meter, person]
    );
    await connection.end();
    res.status(201).json({
      success: true,
      product: { id: result.insertId, ...req.body, imagePaths },
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});

app.get('/api/products/test',authenticateToken , async (req, res) => {
  const { search, take, skip } = req.query; // Use req.query for GET requests
  const limit = take ? parseInt(take) : 100 ; // Default to 10 if take is not provided
  const offset = skip ? parseInt(skip) : 0; // Default to 0 if skip is not provided

  let searchQuery = '';
  let searchParams = [];

  // If search term is provided, add it to the WHERE clause
  if (search && search.trim()) {
    // Construct a dynamic WHERE clause that searches across all columns
    searchQuery = `
      WHERE type LIKE ? OR
            code LIKE ? OR
            designNo LIKE ? OR
            name LIKE ? OR
            description LIKE ? OR
            size LIKE ? OR
            color LIKE ? OR
            packing LIKE ? OR
            rate LIKE ? 
            meter LIKE ? 
    `;

    // Prepare the search parameters, using the search term for all columns
    const searchTerm = `%${search}%`;
    searchParams = new Array(9).fill(searchTerm);  // We have 10 columns to search
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT * FROM product
      ${searchQuery}
      LIMIT ${limit} OFFSET ${offset}  -- Directly insert limit and offset values
    `;

    const params = [...searchParams]; 

    const [products] = await connection.execute(query, params);
    console.log("products :- ",products);
    const baseUrl = `http://103.251.16.248:5000`; // Adjust to your server's base URL
    const productsWithUrls = products.map(product => ({
      ...product,
      imagePaths: JSON.parse(product.image).map(image => `${baseUrl}/${image}`)
    }));
    await connection.end();

    // res.json(products);

    res.json(productsWithUrls);
    } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
  }
});

app.put('/api/product/:id', upload.array('images', 11),authenticateToken, async (req, res) => {
  console.log('Updating product data');
  const { id } = req.params;
  const { type, designNo, name, size, color, packing, rate, meter, person } = req.body;
  let imagePaths = [];

  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map(file => {
      const relativePath = path.relative(__dirname, file.path);
      return relativePath.replace(/\\/g, '/');
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Fetch existing images if no new images are uploaded
    if (imagePaths.length === 0) {
      const [rows] = await connection.query(
        'SELECT image FROM product WHERE id = ?',
        [id]
      );
      if (rows.length > 0) {
        imagePaths = JSON.parse(rows[0].image);
      }
    }

    const [result] = await connection.query(
      `UPDATE product 
       SET type = ?, code = ?, designNo = ?, name = ?, description = ?, size = ?, color = ?, packing = ?, rate = ?, image = ?, meter = ?, person = ?
       WHERE id = ?`,
      [type, '', designNo, name, '', size, color, packing, rate, JSON.stringify(imagePaths), meter, person, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product: { id, type, code: '', designNo, name, description: '', size, color, packing, rate, imagePaths, meter, person },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// delete product 
app.delete('/api/delete',authenticateToken, async (req, res) => {
  const { ids } = req.body; 

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required and cannot be empty' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM product WHERE id IN (${placeholders})`;

    const [result] = await connection.query(query, ids);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No matching records found' });
    }

    res.status(200).json({ message: 'Records deleted successfully' });

  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ error: 'Failed to delete products', details: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  const { search, filters } = req.query;

  if (!search) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const searchTerms = search.trim().split(' ');
  const filterList = filters ? filters.split(',') : [];

  const allowedFilters = [
    'Type', 'Price', 'Meter', 'Color'
  ]; // Match this to frontend filter names

  try {
    const connection = await mysql.createConnection(dbConfig);

    let sql = `SELECT * FROM product WHERE `;
    const conditions = [];
    const values = [];

    searchTerms.forEach(term => {
      const termConditions = [];

      if (filterList.length === 0 || filterList.includes('All')) {
        // Search across all fields
        termConditions.push(
          'type LIKE ?', 'code LIKE ?', 'designNo LIKE ?', 'name LIKE ?',
          'description LIKE ?', 'meter LIKE ?', 'size LIKE ?', 'color LIKE ?',
          'packing LIKE ?', 'rate LIKE ?', 'person LIKE ?',
          'CAST(meter AS CHAR) LIKE ?', 'CAST(rate AS CHAR) LIKE ?'
        );
        for (let i = 0; i < 13; i++) {
          values.push(`%${term}%`);
        }
      } else {
        // Filter-specific search
        if (filterList.includes('Type')) {
          termConditions.push('type LIKE ?');
          values.push(`%${term}%`);
        }
        if (filterList.includes('Price')) {
          termConditions.push('rate LIKE ?');
          values.push(`%${term}%`);
        }
        if (filterList.includes('Meter')) {
          termConditions.push('meter LIKE ?');
          values.push(`%${term}%`);
        }
        if (filterList.includes('Color')) {
          termConditions.push('color LIKE ?');
          values.push(`%${term}%`);
        }
      }

      conditions.push(`(${termConditions.join(' OR ')})`);
    });

    sql += conditions.join(' AND ');

    const [rows] = await connection.query(sql, values);
    await connection.end();

    res.status(200).json(rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search products', details: error.message });
  }
});



const Host = '192.168.42.243';
app.listen(port, () => console.log(`Server running on http://${Host}:${port}`));
