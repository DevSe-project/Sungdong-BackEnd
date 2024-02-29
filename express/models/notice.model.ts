import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";

// 쿼리문 상세하게 업데이트해야 할 소요 있음

class Notice {
  static connection = db.getConnection();

  /**
   * 
   * @param newPost users_id, title, content, date, writer
   * @returns setData
   */
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
    const offset: number = (currentPage - 1) * itemsPerPage;
    const limit: number = itemsPerPage;
    const query = `
    SELECT *, DATE_FORMAT(post_date, '%Y/%m/%d %H:%i') AS formatted_date FROM notice LIMIT ?, ?
    `;
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM product";
    this.connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        this.connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      this.connection.query(query, [offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
          this.connection.releaseConnection;
          return;
        }
        else {
          const totalPages = Math.ceil(totalRows / itemsPerPage);

          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("게시물이 갱신되었습니다: ", responseData);
          result(null, responseData);
          this.connection.releaseConnection;
          return;
        }
      });
    })
  }

  /**
   * postId와 일치하는 post를 조회합니다.
   * @param postId 
   * @param result 
   */
  static selectMatchedPost(postId: number, result: (error: any, data: any) => void) {
    const query = `SELECT * FROM notice WHERE postId = ?`;
    this.connection.query(query, postId, (err: QueryError | null, res: RowDataPacket[]) => {
      if (err) {
        // 에러가 발생한 경우 에러를 콜백으로 전달합니다.
        result(err, null);
      } else {
        // 쿼리 결과를 콜백으로 전달합니다.
        result(null, res);
      }
    });
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

  static delete(postId: number): Promise<ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        `DELETE FROM notice WHERE postId = ?`,
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


  static async getLoginUserInfo(user: any, result: (arg0: QueryError | string | null, arg1: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => void) {
    this.connection.query(`SELECT * FROM users_info WHERE users_id = ?`, [user.users_id], (err: QueryError | null, res: RowDataPacket[] | RowDataPacket[][]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        this.connection.releaseConnection;
        return;
      } else {
        if (res.length > 0) {
          console.log("찾은 유저: ", res[0]);
          result(null, res[0]); // 찾은 사용자 정보 반환
          this.connection.releaseConnection;
        } else {
          // 결과가 없을 시
          result("찾을 수 없습니다.", null);
          this.connection.releaseConnection;
        }
      }
    })
  }


}


export default Notice;
