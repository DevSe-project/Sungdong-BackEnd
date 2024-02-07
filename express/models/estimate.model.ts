import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Estimate {
  // category 튜플 추가
  static createBoxItem(newProduct: any, userId: string, result: (error: any, results: any) => void) {
    const query = "INSERT INTO estimateBox_product SET ?, estimateBox_id = (SELECT estimateBox_id FROM estimateBox WHERE users_id = ?)";
    const promises: Promise<any>[] = [];
  
    if (!Array.isArray(newProduct.product1)) {
      console.error("Invalid newProduct format. 'product1' should be an array.");
      result("Invalid newProduct format.", null);
      return;
    }
  
    newProduct.product1.forEach((product: any) => {
      const values = {
        product_id: product.product_id,
        category_id: product.category_id,
        parentsCategory_id: product.parentsCategory_id,
        estimateBox_price: product.estimateBox_price,
        estimateBox_discount: product.estimateBox_discount,
        estimateBox_cnt: product.estimateBox_cnt,
        estimateBox_selectedOption: product.estimateBox_selectedOption,
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
    const query = `SELECT * FROM estimateBox JOIN estimateBox_product ON estimateBox.estimateBox_id = estimateBox_product.estimateBox_id JOIN product ON product.product_id = estimateBox_product.product_id WHERE estimateBox.users_id = ? ORDER BY estimateBox_product.estimateBox_product_id DESC LIMIT ?, ?`;
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM estimateBox JOIN estimateBox_product ON estimateBox.estimateBox_id = estimateBox_product.estimateBox_id WHERE estimateBox.users_id = ?";
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
    if (data[3] === null) {
      query = `
                SELECT * 
                FROM estimateBox_product
                WHERE estimateBox_product.estimateBox_id = (select estimateBox_id from estimateBox WHERE users_id = ?)
                    AND estimateBox_product.product_id = ?
                    AND estimateBox_product.category_id = ?`;
    } else {
      query = `
                SELECT * 
                FROM estimateBox_product
                WHERE estimateBox_product.estimateBox_id = (select estimateBox_id from estimateBox WHERE users_id = ?)
                    AND estimateBox_product.product_id = ?
                    AND estimateBox_product.category_id = ? 
                    AND estimateBox_product.estimateBox_selectedOption = ?`;
    }

    connection.query(query, [data[0], data[1], data[2], data[3] && data[3]], (err: QueryError | null, res: RowDataPacket[]) => {
      try {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
        } else {
          if (res.length > 0) {
            console.log("견적함에 중복된 상품이 있습니다.: ", res);
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
  static create(newProduct: any, result: (arg0: any, arg1: any) => void) {
    performTransaction((connection: PoolConnection) => {
      const queries = [
        "INSERT INTO estimate SET ?",
        "INSERT INTO estimate_product SET ?",
      ];

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          const query = queries[queryIndex];

          // 2번째 쿼리만 객체의 개수만큼 반복하기 위한 조건
          if (queryIndex === 1 && newProduct[0].product2 && newProduct[0].product2.length > 0) {
            // 2번째 쿼리가 모두 수행될 때 넘기도록 Promise화
            const promises = newProduct[0].product2.map((item: any) => {
              return new Promise((resolve, reject) => {
                connection.query(query, [item], (err, res) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(res);
                  }
                });
              });
            });

            // 2번째 쿼리가 전부 수행되면 푸시 & 커밋
            Promise.all(promises)
              .then((resArray) => {
                results.push(resArray);
                executeQuery(queryIndex + 1); // Proceed to the next query
              })
              .catch((err) => {
                console.log(`쿼리 실행 중 에러 발생 (인덱스 ${queryIndex}): `, err);
                connection.rollback(() => {
                  result(err, null);
                  connection.release();
                });
              });
          } else {
            // 나머지 쿼리문 수행
            connection.query(query, [newProduct[0][`product${queryIndex + 1}`]], (err, res) => {
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
          }
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

      executeQuery(0); // Start with the first query
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
    const query = "DELETE FROM estimateBox_product WHERE estimateBox_product_id IN (?)"
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

export = Estimate;