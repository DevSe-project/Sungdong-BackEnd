import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";

class Notice {
  static connection = db.getConnection();

  static create(newPost: any): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `INSERT INTO notices SET ?`,
        newPost,
        (error: QueryError | null, result: ResultSetHeader) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
    });
  }

  static getAll(): Promise<RowDataPacket[]> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `SELECT * FROM notices`,
        (error: QueryError | null, rows: RowDataPacket[]) => {
          if (error) {
            return reject(error);
          }
          resolve(rows);
        }
      );
    });
  }

  static update(postId: string, updatedContent: string): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `UPDATE notices SET content = ? WHERE id = ?`,
        [updatedContent, postId],
        (error: QueryError | null, result: ResultSetHeader) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
    });
  }

  static delete(postId: string): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `DELETE FROM notices WHERE id = ?`,
        postId,
        (error: QueryError | null, result: ResultSetHeader) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
    });
  }
}

export default Notice;
