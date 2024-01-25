import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();

class Product {
    // category 튜플 추가
    static create(newProduct:any, result: (arg0: any, arg1: any) => void) {
      connection.beginTransaction((err) => {
        if (err) {
        console.log('트랜잭션 시작 중 에러 발생: ', err);
        result(err, null);
        return;
        }
    
        const queries = [
        "INSERT INTO product SET ?",
        "INSERT INTO product_option SET ?",
        ];
    
        const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];
    
        function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
            connection.query(queries[queryIndex], newProduct[`product${queryIndex + 1}`], (err, res) => {
            if (err) {
                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                connection.rollback(() => {
                result(err, null);
                });
            } else {
                results.push(res);
                executeQuery(queryIndex + 1);
            }
            });
        } else {
            connection.commit((commitErr) => {
            if (commitErr) {
                console.log('커밋 중 에러 발생: ', commitErr);
                connection.rollback(() => {
                result(commitErr, null);
                });
            } else {
                console.log('트랜잭션 성공적으로 완료: ', results);
                result(null, results);
            }
            });
        }
        }
        executeQuery(0);
    });
    }
    static list(result: (arg0: any, arg1: any) => void) {
      const query = `SELECT * FROM product JOIN product_option ON product.product_id = product_option.product_id`;
      connection.query(query, (err: QueryError | null, res:RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            result(err, null);
            return;
          }
          else {
            // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
            console.log("상품이 갱신되었습니다: ", res);
            result(null, res);
            return;
          }
      });
    }
    static getByParentCategoryId(parentsCategory_id: string): Promise<any[] | null>  {
      return new Promise<any[] | null>((resolve, reject) => {
        const query = "SELECT * FROM category WHERE parentsCategory_id = ?";
        connection.query(query, [parentsCategory_id], (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("데이터 조회 중 에러 발생: ", err);
            reject(err);
          }
          console.log("데이터 조회 완료: ", res);
          resolve(res);
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
      })
      .catch(error => {
        console.log("에러 발생: ", error);
        result(error, null);
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
        });
      });
    }
    static deleteByIds(items: any[], result: (error: any, response: any) => void) {
      const deleteCategoryIds = items.map(item => item.category_id);
    
      // 배열에 값이 있는 경우에만 DELETE 쿼리 실행
      if (deleteCategoryIds.length > 0) {
        // 배열의 길이에 따라서 IN 연산자와 플레이스홀더 동적 생성
        const placeholders = Array.from({ length: deleteCategoryIds.length }, (_, index) => `?`).join(', ');
        const deleteQuery = `DELETE FROM category WHERE category_id IN (${placeholders})`;
    
        connection.query(deleteQuery, deleteCategoryIds, (err: QueryError | null, res: RowDataPacket[]) => {
          if (err) {
            console.log("삭제 작업 중 에러 발생: ", err);
            result(err, null);
            return;
          }
          console.log("삭제 작업이 완료되었습니다.", res);
          result(null, res);
        });
      } else {
        // 삭제할 데이터가 없는 경우에도 콜백 호출
        result(null, "삭제할 데이터가 없습니다.");
      }
    }
}

export = Product;