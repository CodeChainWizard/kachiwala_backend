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
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
})();

// Routes
// code
// description
app.post('/api/product', upload.array('images', 11), async (req, res) => {
  console.log('Received product data');
  const { type, code, designNo, name, description, size, color, packing, rate, meter } = req.body;

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
      `INSERT INTO product (type, code, designNo, name, description, size, color, packing, rate, image , meter )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [type, code, designNo, name, description, size, color, packing, rate, JSON.stringify(imagePaths), meter]
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

app.put('/api/product/:id', upload.array('images', 11), async (req, res) => {
  console.log('Updating product data');
  const { id } = req.params;
  const { type, designNo, name, size, color, packing, rate, meter } = req.body;
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
       SET type = ?, code = ?, designNo = ?, name = ?, description = ?, size = ?, color = ?, packing = ?, rate = ?, image = ?, meter = ?
       WHERE id = ?`,
      [type, '', designNo, name, '', size, color, packing, rate, JSON.stringify(imagePaths), meter, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product: { id, type, code: '', designNo, name, description: '', size, color, packing, rate, imagePaths, meter },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});


// const Host = '192.168.1.17' || 'localhost';
app.delete('/api/delete/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('DELETE FROM product WHERE id = ?', [id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json({ message: 'Record deleted successfully' });

  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

const Host = 'localhost';
app.listen(port, () => console.log(`Server running on http://${Host}:${port}`));
