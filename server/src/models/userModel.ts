import sqlite3 from 'sqlite3';
import config from '../config';

export interface IUser {
  id: string;
  email: string;
  displayName: string;
  googleId?: string;
  photo?: string;
  createdAt: Date;
}

// Create a connection to SQLite
const db = new sqlite3.Database(config.sqlitePath);

// Initialize users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      googleId TEXT UNIQUE,
      photo TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log("Users table initialized");
});

// Promisify methods
const runAsync = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(this: sqlite3.RunResult, err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getAsync = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Create the model object first
export const UserModel = {
  // Find user by ID
  findById: async (id: string): Promise<IUser | null> => {
    try {
      const user = await getAsync('SELECT * FROM users WHERE id = ?', [id]);
      return user || null;
    } catch (err) {
      console.error('Error finding user by ID:', err);
      return null;
    }
  },

  // Find user by Google ID
  findByGoogleId: async (googleId: string): Promise<IUser | null> => {
    try {
      const user = await getAsync('SELECT * FROM users WHERE googleId = ?', [googleId]);
      return user || null;
    } catch (err) {
      console.error('Error finding user by Google ID:', err);
      return null;
    }
  },

  // Find user by email
  findByEmail: async (email: string): Promise<IUser | null> => {
    try {
      const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
      return user || null;
    } catch (err) {
      console.error('Error finding user by email:', err);
      return null;
    }
  },

  // Create a new user
  create: async (user: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser | null> => {
    try {
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await runAsync(`
        INSERT INTO users (id, email, displayName, googleId, photo)
        VALUES (?, ?, ?, ?, ?)
      `, [
        id,
        user.email,
        user.displayName,
        user.googleId || null,
        user.photo || null
      ]);

      return await getAsync('SELECT * FROM users WHERE id = ?', [id]);
    } catch (err) {
      console.error('Error creating user:', err);
      return null;
    }
  },

  // Update user information
  update: async (id: string, updates: Partial<IUser>): Promise<IUser | null> => {
    try {
      // Build UPDATE statement
      const allowedFields = ['email', 'displayName', 'googleId', 'photo'];
      const setStatements: string[] = [];
      const values: any[] = [];

      allowedFields.forEach(field => {
        if (field in updates) {
          setStatements.push(`${field} = ?`);
          values.push((updates as any)[field]);
        }
      });

      if (setStatements.length === 0) {
        return await UserModel.findById(id);
      }
      
      values.push(id);
      
      await runAsync(
        `UPDATE users SET ${setStatements.join(', ')} WHERE id = ?`,
        values
      );

      return await getAsync('SELECT * FROM users WHERE id = ?', [id]);
    } catch (err) {
      console.error('Error updating user:', err);
      return null;
    }
  }
};

export default UserModel; 