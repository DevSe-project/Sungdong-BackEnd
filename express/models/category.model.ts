import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, Pool } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Category {
    // category 튜플 추가
    static create(newCategory:any):any {
      const query = `INSERT INTO category SET ?`;
      const results : any = [];
      for (let i = 0; i < newCategory.length; i++) {
      connection.query(query, newCategory[i], (err: QueryError | null, res:RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            return err;
          }
          else {
            results.push(res[0]);
            // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
            if (results.length === newCategory.length) {
              console.log("새 카테고리가 생성되었습니다: ", ...results);
              connection.releaseConnection;
              return results
            }
          }
        });
      }
    }
    static list(result: (arg0: any, arg1: any) => void) {
      const query = `SELECT * FROM category`;
      connection.query(query, (err: QueryError | null, res:RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            result(err, null);
            connection.releaseConnection;
            return;
          }
          else {
            console.log("카테고리가 갱신되었습니다: ", res);
            result(null, res);
            connection.releaseConnection;
            return;
          }
      });
    }
    static getByParentCategoryId(parentsCategory_id: string): Promise<any[] | null>  {
      return new Promise<any[] | null>((resolve, reject) => {
        let query;
        if (parentsCategory_id == null) {
          query = "SELECT * FROM category WHERE LENGTH(category_id) = 1"
        } else {   
          query = "SELECT * FROM category WHERE parentsCategory_id = ?";
        }
        connection.query(query, [parentsCategory_id], (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("데이터 조회 중 에러 발생: ", err);
            reject(err);
          } else {
            console.log("데이터 조회 완료: ", res);
            resolve(res);
          }
          connection.releaseConnection;
        });
      })
    }
    
    static updateByParentCategoryId(parentsCategory_id: string, data: any[], result: (error: any, response: any) => void) {
      const updateQuery = "UPDATE category SET name = ? WHERE parentsCategory_id = ? AND category_id = ?";
      // 모든 데이터에 대해 비동기적으로 UPDATE 쿼리 실행
      Promise.all(data.map(item => {
        return new Promise((resolve, reject) => {
          connection.query(updateQuery, [item.name, item.parentsCategory_id, item.category_id], (err: QueryError | null, res: RowDataPacket[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });
      }))
      .then(results => {
        console.log("모든 카테고리가 갱신되었습니다.");
        result(null, results);
        connection.releaseConnection;
      })
      .catch(error => {
        console.log("에러 발생: ", error);
        result(error, null);
        connection.releaseConnection;
      });
    }
    static async getlastestCategoryId(parentCategory: string | null): Promise<string | null> {
      return new Promise<string | null>((resolve, reject) => {
        let query;
        if (parentCategory == null) {
          query = "SELECT category_id FROM category WHERE LENGTH(category_id) = 1 ORDER BY category_id DESC LIMIT 1";
        } else {
          query = "SELECT category_id FROM category WHERE parentsCategory_id = ? ORDER BY category_id DESC LIMIT 1";
        }
    
        connection.query(query, parentCategory, (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            reject(err);
          } else {
            if (res.length > 0) {
              console.log("해당 분류의 가장 마지막 카테고리: ", res[0].category_id);
              resolve(res[0].category_id);
            } else {
              console.log("해당 분류의 가장 마지막 카테고리: ", null);
              resolve(null);
            }
          }
          connection.releaseConnection;
        });
      });
    }
    static deleteByIds(items: any[], result: (error: any, response: any) => void) {
      const deleteCategoryIds = items.map((item) => item.category_id);
    
      // 배열에 값이 있는 경우에만 DELETE 쿼리 실행
      if (deleteCategoryIds.length > 0) {
        // 배열의 길이에 따라서 IN 연산자와 플레이스홀더 동적 생성
        const placeholders = Array.from({ length: deleteCategoryIds.length }, (_, index) => `category_id LIKE ?`).join(' OR ');
        const deleteQuery = `DELETE FROM category WHERE ${placeholders}`;
    
        connection.query(deleteQuery, items.map(item => `${item.category_id}%`), (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("삭제 작업 중 에러 발생: ", err);
            result(err, null);
            connection.releaseConnection;
            return;
          }
            console.log("삭제 작업이 완료되었습니다.", res);
            result(null, res);
            connection.releaseConnection;
          });
          } else {
            // 삭제할 데이터가 없는 경우에도 콜백 호출
            result(null, "삭제할 데이터가 없습니다.");
            connection.releaseConnection;
          }
    }
}

export = Category;