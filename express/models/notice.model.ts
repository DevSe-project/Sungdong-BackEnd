import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";

// 쿼리문 상세하게 업데이트해야 할 소요 있음

class Notice {
  static connection = db.getConnection();

  static create(newPost: any): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `INSERT INTO notice SET ?`,
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

  /**
   * Posts를 조회합니다.
   * @param currentPage 현재 페이지 번호
   * @param itemsPerPage 페이지 당 포스팅 개수
   * @param result 조회 결과 반환
   */
  static selectAllToPageNumber(currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;

    this.connection.query(
      `SELECT * FROM notice LIMIT ?, ?`,
      [offset, limit],
      (error: QueryError | null, rows: RowDataPacket[]) => {
        if (error) {
          result(error, null);
        } else {
          result(null, rows);
        }
      }
    );
  }



  static update(postId: string, updatedContent: string): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `UPDATE notice SET content = ? WHERE id = ?`,
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
        `DELETE FROM notice WHERE id = ?`,
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
