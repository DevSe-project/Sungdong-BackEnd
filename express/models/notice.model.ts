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
    const offset: number = (currentPage - 1) * itemsPerPage;
    const limit: number = itemsPerPage;
    const query = `
      SELECT * FROM notice LIMIT ?, ?
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


  static async getUserInfo(userId: string) {
    // 데이터베이스에서 해당 사용자의 정보를 조회하는 로직을 작성합니다.
    try {
      // 이 부분 delete부분이랑 유사하게 리팩토링해야 함
      const getName = await this.connection.query('SELECT name FROM users_info WHERE users_id = ?', [userId]);
      return getName;
    } catch (error) {
      // 에러 처리
      console.error(error);
      throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }
  }

}


export default Notice;
