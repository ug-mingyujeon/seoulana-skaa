import sqlite3 from 'sqlite3';
import config from '../config';

export interface ISession {
  sessionPublicKey: string;
  userMainPublicKey: string;
  expiresAt: number;
  isRevoked: boolean;
  createdAt: Date;
}

// Create a connection to SQLite
const db = new sqlite3.Database(config.sqlitePath);

// Initialize the sessions table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionPublicKey TEXT PRIMARY KEY,
      userMainPublicKey TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      isRevoked INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_userMainPublicKey ON sessions(userMainPublicKey)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expiresAt ON sessions(expiresAt)`);
  
  console.log("Sessions table initialized");
});

// Promisify methods properly
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

const allAsync = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Database operations for sessions
export default {
  // Create a new session
  create: async (session: Omit<ISession, 'createdAt'>): Promise<void> => {
    try {
      await runAsync(`
        INSERT INTO sessions (sessionPublicKey, userMainPublicKey, expiresAt, isRevoked)
        VALUES (?, ?, ?, ?)
      `, [
        session.sessionPublicKey,
        session.userMainPublicKey,
        session.expiresAt,
        session.isRevoked ? 1 : 0 // SQLite uses 0/1 for booleans
      ]);
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  },

  // Find a session by its public key
  findOne: async (filter: { sessionPublicKey: string }): Promise<ISession | null> => {
    try {
      const row = await getAsync(`
        SELECT 
          sessionPublicKey, 
          userMainPublicKey, 
          expiresAt, 
          isRevoked, 
          createdAt 
        FROM sessions 
        WHERE sessionPublicKey = ?
        LIMIT 1
      `, [filter.sessionPublicKey]);
      
      if (row) {
        // Convert SQLite's integer 0/1 back to boolean
        return {
          ...row,
          isRevoked: !!row.isRevoked
        } as ISession;
      }
      return null;
    } catch (err) {
      console.error('Error finding session:', err);
      throw err;
    }
  },

  // Find multiple sessions by criteria
  find: async (filter: any): Promise<ISession[]> => {
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: any[] = [];

    if (filter.expiresAt && filter.expiresAt.$lt) {
      query += ' AND expiresAt < ?';
      params.push(filter.expiresAt.$lt);
    }

    if (filter.isRevoked !== undefined) {
      query += ' AND isRevoked = ?';
      params.push(filter.isRevoked ? 1 : 0);
    }

    try {
      const rows = await allAsync(query, params);
      // Convert SQLite's integer 0/1 back to boolean for all rows
      return rows.map((row: any) => ({
        ...row,
        isRevoked: !!row.isRevoked
      })) as ISession[];
    } catch (err) {
      console.error('Error finding sessions:', err);
      throw err;
    }
  },

  // Update a session
  updateOne: async (filter: any, update: any): Promise<{ modifiedCount: number }> => {
    let query = 'UPDATE sessions SET';
    const setValues: string[] = [];
    const params: any[] = [];

    // Build the SET part of the query
    if (update.isRevoked !== undefined) {
      setValues.push('isRevoked = ?');
      params.push(update.isRevoked ? 1 : 0);
    }

    if (setValues.length === 0) {
      return { modifiedCount: 0 };
    }

    query += ' ' + setValues.join(', ');
    query += ' WHERE 1=1';

    // Build the WHERE part of the query
    if (filter.sessionPublicKey) {
      query += ' AND sessionPublicKey = ?';
      params.push(filter.sessionPublicKey);
    }

    if (filter.userMainPublicKey) {
      query += ' AND userMainPublicKey = ?';
      params.push(filter.userMainPublicKey);
    }

    if (filter._id) {
      query += ' AND sessionPublicKey = ?';
      params.push(filter._id); // Assuming _id is the same as sessionPublicKey in this context
    }

    try {
      const result = await runAsync(query, params);
      // SQLite's changes property shows how many rows were modified
      return { modifiedCount: result.changes || 0 };
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  },

  // Close the database connection
  close: () => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}; 