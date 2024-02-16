import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, OkPacket, ProcedureCallPacket, PoolConnection } from 'mysql2';
import db from '../db';

// getConnection 함수로 connection 객체 얻기
const connection = db.getConnection();
const performTransaction = db.performTransaction;

class Order {
  // category 튜플 추가
  static create(newProduct: any, result: (arg0: any, arg1: any) => void) {
    performTransaction((connection: PoolConnection) => {
      const queries = [
        "INSERT INTO `order` SET ?",
        "INSERT INTO order_product SET ?",
        "INSERT INTO delivery SET ?"
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
  static list(user_id: string, currentPage: any, postsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * postsPerPage;
    const limit = postsPerPage;
    // 주문 정보와 상품 정보를 조합하여 가져오는 쿼리
    const query = "SELECT orders.order_id, orders.users_id, orders.order_date, orders.orderState, IFNULL(delivery.delivery_date, '') AS delivery_date, IFNULL(delivery.delivery_selectedCor,'') AS delivery_selectedCor, delivery.deliveryType, IFNULL(delivery.delivery_num, '') AS delivery_num, GROUP_CONCAT(JSON_OBJECT(\'order_productPrice\', order_product.order_productPrice,\'selectedOption\', IFNULL(order_product.selectedOption, ''), \'order_cnt\', order_product.order_cnt,\'product_spec\', IFNULL(product.product_spec,'') ,\'product_title\', product.product_title, \'product_image_original\', IFNULL(product.product_image_original, '') )) AS products FROM `order` AS orders JOIN order_product ON orders.order_id = order_product.order_id JOIN product ON product.product_id = order_product.product_id JOIN delivery ON delivery.order_id = orders.order_id WHERE orders.users_id = ? GROUP BY orders.order_id, orders.users_id, orders.order_date, orders.orderState, IFNULL(delivery.delivery_selectedCor,''), delivery.deliveryType, IFNULL(delivery.delivery_num,''), IFNULL(delivery.delivery_date,'') ORDER BY orders.order_date DESC LIMIT ?, ?";
    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = "SELECT COUNT(*) as totalRows FROM `order` WHERE users_id = ?";
    connection.query(countQuery, [user_id], (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;
      connection.query(query, [user_id, offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log(err)
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
  //가장 최근 회원의 주문 내역에서 주문 상품들 뽑아내기
  static findList(user_id: string, result: (arg0: any, arg1: any) => void) {
    const query = "SELECT * FROM order_product JOIN product ON order_product.product_id = product.product_id WHERE order_id = (SELECT order.order_id FROM `order` JOIN delivery ON order.order_id = delivery.order_id WHERE order.users_id = ? ORDER BY order.order_date DESC LIMIT 1)";
    connection.query(query, user_id, (err: QueryError | null, res: RowDataPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      else {
        // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
        console.log("상품이 갱신되었습니다: ", res);
        result(null, res);
        connection.releaseConnection;
        return;
      }
    });
  }
  //특정 주문의 주문 상품들 출력하기
  static selectOrderProductById(order_id: string, result: (arg0: any, arg1: any) => void) {
    const query = "SELECT * FROM order_product JOIN product ON order_product.product_id = product.product_id WHERE order_id = ?";
    connection.query(query, order_id, (err: QueryError | null, res: RowDataPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      else {
        // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
        console.log("상품이 갱신되었습니다: ", res);
        result(null, res);
        connection.releaseConnection;
        return;
      }
    });
  }
  //회원의 주문 내역에서 특정 조건의 주문 상품들 뽑아내기
  static findSelectOrderList(user_id: string, order_id: string, result: (arg0: any, arg1: any) => void) {
    const query = "SELECT `order`.*, delivery.deliveryType, delivery.delivery_date, delivery.delivery_selectedCor, delivery.delivery_message FROM `order` JOIN delivery ON order.order_id = delivery.order_id WHERE order.users_id = ? AND order.order_id = ?";
    connection.query(query, [user_id, order_id], (err: QueryError | null, res: RowDataPacket[]) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        connection.releaseConnection;
        return;
      }
      else {
        // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
        console.log("주문 내역을 불러왔습니다: ", res);
        result(null, res);
        connection.releaseConnection;
        return;
      }
    });
  }
  //가장 최근 회원의 주문내역 1건 뽑아내기
  static findOne(userData: any, result: (arg0: any, arg1: any) => void) {
    const query = "SELECT * FROM `order` JOIN delivery ON order.order_id = delivery.order_id WHERE order.users_id = ? ORDER BY order.order_date DESC LIMIT 1";
    connection.query(query, userData, (err: QueryError | null, res: RowDataPacket[]) => {
      try {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
        } else {
          console.log("해당 유저의 가장 마지막 주문을 불렀습니다.: ", res[0]);
          result(null, res[0]);
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
  // 배송리스트 조회(전체) : JOIN(order | product | delivery)
  static getOrderList(currentPage: number, itemsPerPage: number, requestData: any, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    performTransaction((connection: PoolConnection) => {

      const queries = [
        `
        SELECT 
        o.*,
        d.*,
        product_length,
        order_sum,
        product_title  
    FROM 
        delivery d
    JOIN 
        \`order\` o ON d.order_id = o.order_id
    JOIN (
        SELECT 
            o.order_id,
            COUNT(*) AS product_length,
            SUM(op.order_cnt) AS order_sum,
            MAX(p.product_title) AS product_title  
        FROM 
            \`order\` o
        JOIN 
            order_product op ON o.order_id = op.order_id 
        JOIN 
            product p ON op.product_id = p.product_id
        GROUP BY 
            o.order_id
        ) AS subquery ON o.order_id = subquery.order_id
      WHERE o.orderState < ? AND (o.isCancel = 0 OR o.isCancel IS NULL)
      LIMIT ?, ?  
      `
      ];

        // 전체 데이터 크기 확인을 위한 쿼리
        const countQuery = `
        SELECT 
          COUNT(*) as totalRows 
        FROM 
          delivery d
        JOIN 
        \`order\` o ON d.order_id = o.order_id
        WHERE o.orderState < ? AND (o.isCancel = 0 OR o.isCancel IS NULL)
      `;

      connection.query(countQuery, [requestData !== null ? requestData : 2], (err, countResult: any) => {
        if (err) {
          result(err, null);
          return;
        }
        const totalRows = countResult[0].totalRows !== 0 ? countResult[0].totalRows : 1 

      const results: (OkPacket | RowDataPacket[] | ResultSetHeader[] | RowDataPacket[][] | OkPacket[] | ProcedureCallPacket)[] = [];

      function executeQuery(queryIndex: number) {
        if (queryIndex < queries.length) {
          connection.query(queries[queryIndex], [requestData !== null ? requestData : 2, offset, limit], (err, res) => {
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
                const totalPages = Math.ceil(totalRows / itemsPerPage);
                const responseData = {
                  data: results,
                  currentPage: currentPage,
                  totalPages: totalPages,
                }
                // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
                console.log("상품이 갱신되었습니다: ", responseData);
                result(null, responseData);
              }
              connection.release();
            })
          }
      }
      executeQuery(0);
    });
    })
  }

  static async updateDeliveryInvoice(orderId: string, newNum: string) {
    try {
      const rows = await connection.execute(
        'UPDATE delivery JOIN \`order\` ON order.order_id = delivery.order_id SET delivery.delivery_num = ?, order.orderState = 2 WHERE order.order_id = ?',
        [newNum, orderId]
      );
      connection.releaseConnection;
      return rows;
    } catch (error: any) {
      throw new Error(`Failed to update delivery state: ${error.message}`);
    }
  }

  static async canceleOrder(cancelReason: string, order_id: string) {
    try {
      const rows = await connection.execute(
        'UPDATE \`order\` SET order.isCancel = 1, order.cancelReason = ?  WHERE order.order_id = ?',
        [cancelReason, order_id]
      );
      connection.releaseConnection;
      return rows;
    } catch (error: any) {
      throw new Error(`Failed to update delivery state: ${error.message}`);
    }
  }

  static deleteByIds(product: number[], result: (error: any, response: any) => void) {
    const query = "DELETE FROM cart_product WHERE cart_product_id IN (?)"
    console.log(query)
    console.log(product)
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

export = Order;