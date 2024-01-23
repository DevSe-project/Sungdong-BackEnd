import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();

class Category {
    // category 튜플 추가
    static create(newCategory:any, result: (arg0: any, arg1: any) => void) {
      const query = `INSERT INTO category SET ?`;
      const results : any = [];
      for (let i = 0; i < newCategory.length; i++) {
      connection.query(query, newCategory[i], (err: QueryError | null, res:RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            result(err, null);
            return;
          }
          else {
            results.push(res);
            // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
            if (results.length === newCategory.length) {
              console.log("새 카테고리가 생성되었습니다: ", ...results);
              result(null, results);
              return;
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
            return;
          }
          else {
            // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
            console.log("카테고리가 갱신되었습니다: ", res);
            result(null, res);
            return;
          }
      });
    }
    static lastest(parentCategory: string | null, result: (arg0: any, arg1: any) => void) {
      let query;
      if (parentCategory == null) {
        query = "SELECT category_id FROM category WHERE LENGTH(category_id) = 1 ORDER BY category_id DESC LIMIT 1";
      } else {
        query = "SELECT category_id FROM category WHERE parentsCategory_id = ? ORDER BY category_id DESC LIMIT 1";
      }
      
      connection.query(query, parentCategory, (err: QueryError | null, res:RowDataPacket[]) => {
          if (err) {
            console.log("에러 발생: ", err);
            result(err, null);
            return;
          }
          else {
            if (res.length > 0) {
              // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
              console.log("해당 분류의 가장 마지막 카테고리: ", res[0].category_id);
              result(null, res[0].category_id);
            } else {
              // 마지막 글자를 찾지 못했을 때 대체 구문 추가
              result(null, null);
            }
          }
      });
    }
}

export = Category;