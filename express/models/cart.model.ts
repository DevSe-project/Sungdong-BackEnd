import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Cart {
  // category 튜플 추가
  static create(newProducts: any, userId:any, result: (error: any, results: any) => void) {
    const query = "INSERT INTO cart_product SET ?, cart_id = (SELECT cart_id FROM cart WHERE users_id = ?)";
    const promises: Promise<any>[] = [];
  
    if (!Array.isArray(newProducts.product1)) {
      console.error("Invalid newProduct format. 'product1' should be an array.");
      result("Invalid newProduct format.", null);
      return;
    }

    newProducts.product1.forEach((product: any) => {
      const values = {
        product_id: product.product_id,
        category_id: product.category_id,
        parentsCategory_id: product.parentsCategory_id,
        cart_price: product.cart_price,
        cart_discount: product.cart_discount,
        cart_cnt: product.cart_cnt,
        cart_selectedOption: product.cart_selectedOption,
      };

      promises.push(new Promise((resolve, reject) => {
        connection.query(query, [values, userId], (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }));
    });

    Promise.all(promises)
      .then((resArray) => {
        console.log('쿼리 실행 성공: ', resArray);
        result(null, resArray);
      })
      .catch((err) => {
        console.log('쿼리 실행 중 에러 발생: ', err);
        result(err, null);
      });
  }
  static list(user_id: string, currentPage: any, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;
    const query = `SELECT * FROM cart JOIN cart_product ON cart.cart_id = cart_product.cart_id JOIN product ON product.product_id = cart_product.product_id WHERE cart.users_id = ? ORDER BY cart_product.cart_product_id DESC LIMIT ?, ?`;
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM cart JOIN cart_product ON cart.cart_id = cart_product.cart_id WHERE cart.users_id = ?";
    connection.query(countQuery, [user_id], (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [user_id, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
          connection.releaseConnection;
          return;
        }
        else {
          const totalPages = Math.ceil(totalRows / postsPerPage);
          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          connection.releaseConnection;
          return;
        }
      });
    })
  }
  static findOne(data: any[], result: (arg0: any, arg1: any) => void) {
    let query;
    if (data[3] === 'null') {
      query = `
                SELECT * 
                FROM cart_product
                WHERE cart_product.cart_id = (select cart_id from cart WHERE users_id = ?)
                    AND cart_product.product_id = ?
                    AND cart_product.category_id = ?`;
    } else {
      query = `
                SELECT * 
                FROM cart_product
                WHERE cart_product.cart_id = (select cart_id from cart WHERE users_id = ?)
                    AND cart_product.product_id = ?
                    AND cart_product.category_id = ? 
                    AND cart_product.cart_selectedOption = ?`;
    }

    connection.query(query, [data[0], data[1], data[2], data[3] && data[3]], (err: QueryError | null, res: RowDataPacket[]) => {
      try {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
        } else {
          if (res.length > 0) {
            console.log("장바구니에 중복된 상품이 있습니다.: ", res);
            result(null, res);
          } else {
            result(null, null);
          }
        }
      } finally {
        connection.releaseConnection; // Release the connection in a finally block
      }
    });
  }
  static edit(newProduct: any, result: (error: any, response: any) => void) {
    performTransaction((connection: PoolConnection) => {

      const queries = [
        "UPDATE product SET ? WHERE product_id = ?",
        "UPDATE product_option SET ? WHERE product_id = ?",
      ];

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], [newProduct[`product${queryIndex + 1}`], newProduct[`product${queryIndex + 1}`].product_id], (err, res) => {
            if (err) {
              console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
              connection.rollback(() => {
                result(err, null);
                connection.release();
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
                connection.release();
              });
            } else {
              console.log('트랜잭션 성공적으로 완료: ', results);
              result(null, results);
              connection.release();
            }
          });
        }
      }
      executeQuery(0);
    });
  }
  static deleteByIds(product: number[], result: (error: any, response: any) => void) {
    const query = "DELETE FROM cart_product WHERE cart_product_id IN (?)"
    connection.query(query, [product], (err, res) => {
      if (err) {
        console.log(`쿼리 실행 중 에러 발생: `, err);
        result(err, null);
        connection.releaseConnection;
      } else {
        console.log('성공적으로 삭제 완료: ', res);
        result(null, res);
        connection.releaseConnection;
      }
    })
  }
}

export = Cart;